'use strict';

import * as cp from 'child_process';

import * as vscode from 'vscode';

import { ThrottledDelayer } from './async';
import { LineDecoder } from './lineDecoder';

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
}

export interface Linter {
	languageId:string,
	loadConfiguration:()=>LinterConfiguration,
	process:(output:string[])=>vscode.Diagnostic[]	
}

export class LintingProvider {
	
	public linterConfiguration: LinterConfiguration;

	private executableNotFound: boolean;
	
	private documentListener: vscode.Disposable;
	private diagnosticCollection: vscode.DiagnosticCollection;
	private delayers: { [key: string]: ThrottledDelayer<void> };
	
	
	private linter:Linter;
	constructor(linter:Linter) {
		this.linter = linter;
		this.executableNotFound = false;
	}

	public activate(subscriptions: vscode.Disposable[]) {
		this.diagnosticCollection = vscode.languages.createDiagnosticCollection();
		subscriptions.push(this);
		vscode.workspace.onDidChangeConfiguration(this.loadConfiguration, this, subscriptions);
		this.loadConfiguration();

		vscode.workspace.onDidOpenTextDocument(this.triggerLint, this, subscriptions);
		vscode.workspace.onDidCloseTextDocument((textDocument)=> {
			this.diagnosticCollection.delete(textDocument.uri);
			delete this.delayers[textDocument.uri.toString()];
		}, null, subscriptions);

		// Lint all open documents documents
		vscode.workspace.textDocuments.forEach(this.triggerLint, this);
	}

	public dispose(): void {
		this.diagnosticCollection.clear();
		this.diagnosticCollection.dispose();
	}

	private loadConfiguration(): void {
		let oldExecutable = this.linterConfiguration && this.linterConfiguration.executable;
		this.linterConfiguration = this.linter.loadConfiguration();
		
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
		vscode.workspace.textDocuments.forEach(this.triggerLint, this);
	}

	private triggerLint(textDocument: vscode.TextDocument): void {
		if (textDocument.languageId !== this.linter.languageId || 
			textDocument.uri.scheme !== "file" ||
			this.executableNotFound ||
			RunTrigger.from(this.linterConfiguration.runTrigger) === RunTrigger.off){
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
			let filePath = textDocument.fileName;
			let decoder = new LineDecoder();
			let decoded = []
			let diagnostics: vscode.Diagnostic[] = [];
			
			let options = vscode.workspace.rootPath ? { cwd: vscode.workspace.rootPath, shell: true } : undefined;
			let args: string[] = [];
			args = args.concat(this.linterConfiguration.module);
			if (RunTrigger.from(this.linterConfiguration.runTrigger) === RunTrigger.onSave) {
				args = args.concat(this.linterConfiguration.fileArgs.slice(0));
				args.push(textDocument.fileName);
			} else {
				args.push(textDocument.fileName);
			}
			args = args.concat(this.linterConfiguration.extraArgs);
			
			let childProcess = cp.spawn(executable, args, options);
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