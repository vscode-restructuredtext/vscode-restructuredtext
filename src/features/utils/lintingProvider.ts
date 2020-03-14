'use strict';

import * as cp from 'child_process';

import * as vscode from 'vscode';

import { ThrottledDelayer } from './async';
import { LineDecoder } from './lineDecoder';
import { Logger } from '../../logger';
import { Configuration } from './configuration';
import { Python } from '../../python';

enum RunTrigger {
	onSave,
	onType,
	off
}

namespace RunTrigger {
	export let strings = {
		onSave: 'onSave',
		onType: 'onType',
		off: 'off'
	}
	export let from = function(value: string): RunTrigger {
		if (value === 'onType') {
			return RunTrigger.onType;
		} else if (value === 'onSave') {
			return RunTrigger.onSave;
		} else {
			return RunTrigger.off;
		}
	}
}

export interface LinterConfiguration {
	executable:string,
	module:string[],
	fileArgs:string[],
	bufferArgs:string[],
	extraArgs:string[],
	runTrigger:string,
	rootPath: string
}

export interface Linter {
	languageId:string,
	loadConfiguration:(resource: vscode.Uri)=>LinterConfiguration,
	process:(output:string[])=>vscode.Diagnostic[]	
}

export class LintingProvider {
	
	public linterConfiguration: LinterConfiguration;

	private executableNotFound: boolean;
	
	private documentListener: vscode.Disposable;
	private diagnosticCollection: vscode.DiagnosticCollection;
	private delayers: { [key: string]: ThrottledDelayer<void> };
	
	
	constructor(
		private readonly linter: Linter, 
		private readonly logger: Logger,
		private readonly python: Python)
	{
		this.executableNotFound = false;
	}

	public activate(subscriptions: vscode.Disposable[]) {
		this.diagnosticCollection = vscode.languages.createDiagnosticCollection();
		subscriptions.push(this);		
		vscode.workspace.onDidChangeConfiguration(this.resetConfiguration, this, subscriptions);
		vscode.workspace.onDidSaveTextDocument((textDocument) => {
			if (textDocument.fileName.endsWith("settings.json")) {
				this.resetConfiguration();
			}
		}, null, subscriptions);
		this.resetConfiguration();
		
		vscode.workspace.onDidOpenTextDocument(this.triggerLint, this, subscriptions);
		vscode.workspace.onDidCloseTextDocument((textDocument)=> {
			this.diagnosticCollection.delete(textDocument.uri);
			delete this.delayers[textDocument.uri.toString()];
		}, null, subscriptions);
	}

	public dispose(): void {
		this.diagnosticCollection.clear();
		this.diagnosticCollection.dispose();
	}

	private resetConfiguration(): void {
		this.linterConfiguration = null;
		vscode.workspace.textDocuments.forEach(this.triggerLint, this);
	}

	private loadConfiguration(resource: vscode.Uri): void {
		let oldExecutable = this.linterConfiguration && this.linterConfiguration.executable;
		this.linterConfiguration = this.linter.loadConfiguration(resource);
		
		this.delayers = Object.create(null);
		if (this.executableNotFound) {
			this.executableNotFound = oldExecutable === this.linterConfiguration.executable;
		}
		if (this.documentListener) {
			this.documentListener.dispose();
		}
		if (RunTrigger.from(this.linterConfiguration.runTrigger) === RunTrigger.onType) {
			this.documentListener = vscode.workspace.onDidChangeTextDocument((e) => {
				this.triggerLint(e.document);
			});
		} else {
			this.documentListener = vscode.workspace.onDidSaveTextDocument(this.triggerLint, this);
		}		
		this.documentListener = vscode.workspace.onDidSaveTextDocument(this.triggerLint, this);
		// Configuration has changed. Reevaluate all documents.
	}

	private async triggerLint(textDocument: vscode.TextDocument): Promise<void> {
		if (Configuration.getLinterDisabled()) {
			return;
		}

		if (!(await this.python.checkLinter(textDocument.uri, false, false))) {
			return;
		}

		const currentFolder = Configuration.GetRootPath(textDocument.uri);
		if (this.linterConfiguration === null || (currentFolder && this.linterConfiguration.rootPath !== currentFolder)) {
			this.loadConfiguration(textDocument.uri);
		}

		if (textDocument.languageId !== this.linter.languageId || 
			textDocument.uri.scheme !== "file" ||
			this.executableNotFound ||
			RunTrigger.from(this.linterConfiguration.runTrigger) === RunTrigger.off) {
			return;
		}

		let key = textDocument.uri.toString();
		let delayer = this.delayers[key];
		if (!delayer) {
			delayer = new ThrottledDelayer<void>(RunTrigger.from(this.linterConfiguration.runTrigger) === RunTrigger.onType ? 250 : 0);
			this.delayers[key] = delayer;
		}
		delayer.trigger(() => this.doLint(textDocument) );
	}

	private doLint(textDocument: vscode.TextDocument): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			let executable = this.linterConfiguration.executable;
			let decoder = new LineDecoder();
			let diagnostics: vscode.Diagnostic[] = [];
			const file = '"' + textDocument.fileName + '"';
			const rootPath = Configuration.GetRootPath(textDocument.uri);
			let options = rootPath ? { rootPath, shell: true } : undefined;
			let args: string[] = [];
			args = args.concat(this.linterConfiguration.module);
			if (RunTrigger.from(this.linterConfiguration.runTrigger) === RunTrigger.onSave) {
				args = args.concat(this.linterConfiguration.fileArgs.slice(0));
				args.push(file);
			} else {
				args.push(file);
			}
			args = args.concat(this.linterConfiguration.extraArgs);
			
			let childProcess = cp.spawn(executable, args, options);
			this.logger.log(`Execute linting: ${executable} ${args.join(' ')} in ${rootPath}.`)
			childProcess.on('error', (error: Error) => {
				if (this.executableNotFound) {
					resolve();
					return;
				}
				let message: string = null;
				if ((<any>error).code === 'ENOENT') {
					message = `Cannot lint ${textDocument.fileName}. The executable '${executable}' was not found. Use the '${this.linter.languageId}.linter.executablePath' setting to configure the location of the executable`;
				} else {
					message = error.message ? error.message : `Failed to run executable using path: ${executable}. Reason is unknown.`;
				}
				this.logger.log(message);
				vscode.window.showInformationMessage(message);
				this.executableNotFound = true;
				resolve();
			});
			
			let onDataEvent = (data:Buffer) => { decoder.write(data) };
			let onEndEvent = () => {
				decoder.end();
				let lines = decoder.getLines();
				if (lines && lines.length > 0) {
					diagnostics = this.linter.process(lines);
				}
				this.diagnosticCollection.set(textDocument.uri, diagnostics);
				resolve();
			}
			
			if (childProcess.pid) {
				if (RunTrigger.from(this.linterConfiguration.runTrigger) === RunTrigger.onType) {
					childProcess.stdin.write(textDocument.getText());
					childProcess.stdin.end();
				}
				childProcess.stderr.on('data', onDataEvent);
				childProcess.stderr.on('end', onEndEvent);
				childProcess.stdout.on('data', onDataEvent);
				childProcess.stdout.on('end', onEndEvent);
			} else {
				resolve();
			}
		});
	}
}