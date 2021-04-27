'use strict';

import * as cp from 'child_process';

import * as vscode from 'vscode';

<<<<<<< HEAD
import { ThrottledDelayer } from './async';
import { LineDecoder } from './lineDecoder';
import { Logger } from '../../logger';
import { Configuration } from './configuration';
import { Python } from '../../python';
=======
import { Logger } from '../../logger';
import { Python } from '../../python';
import { ThrottledDelayer } from './async';
import { Configuration } from './configuration';
import { LineDecoder } from './lineDecoder';
>>>>>>> upstream/master

enum RunTrigger {
	onSave,
	onType,
<<<<<<< HEAD
	off
=======
	off,
>>>>>>> upstream/master
}

namespace RunTrigger {
	export let strings = {
<<<<<<< HEAD
		onSave: 'onSave',
		onType: 'onType',
		off: 'off'
	}
	export let from = function(value: string): RunTrigger {
=======
		off: 'off',
        onSave: 'onSave',
		onType: 'onType',
	};
	export let from = (value: string): RunTrigger => {
>>>>>>> upstream/master
		if (value === 'onType') {
			return RunTrigger.onType;
		} else if (value === 'onSave') {
			return RunTrigger.onSave;
		} else {
			return RunTrigger.off;
		}
<<<<<<< HEAD
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
=======
	};
}

export interface ILinterConfiguration {
	executable: string;
	module: string[];
	fileArgs: string[];
	bufferArgs: string[];
	extraArgs: string[];
	runTrigger: string;
	rootPath: string;
}

export interface ILinter {
	languageId: string;
	loadConfiguration: (resource: vscode.Uri) => Promise<ILinterConfiguration>;
	process: (output: string[]) => vscode.Diagnostic[];
}

export class LintingProvider {

	public linterConfiguration: ILinterConfiguration;

	private executableNotFound: boolean;

	private documentListener: vscode.Disposable;
	private diagnosticCollection: vscode.DiagnosticCollection;
	private delayers: { [key: string]: ThrottledDelayer<void> };

	constructor(
		private readonly linter: ILinter,
		private readonly logger: Logger,
		private readonly python: Python) {
>>>>>>> upstream/master
		this.executableNotFound = false;
	}

	public activate(subscriptions: vscode.Disposable[]) {
		this.diagnosticCollection = vscode.languages.createDiagnosticCollection();
<<<<<<< HEAD
		subscriptions.push(this);		
		vscode.workspace.onDidChangeConfiguration(this.resetConfiguration, this, subscriptions);
		vscode.workspace.onDidSaveTextDocument((textDocument) => {
			if (textDocument.fileName.endsWith("settings.json")) {
=======
		subscriptions.push(this);
		vscode.workspace.onDidChangeConfiguration(this.resetConfiguration, this, subscriptions);
		vscode.workspace.onDidSaveTextDocument((textDocument) => {
			if (textDocument.fileName.endsWith('settings.json')) {
>>>>>>> upstream/master
				this.resetConfiguration();
			}
		}, null, subscriptions);
		this.resetConfiguration();
<<<<<<< HEAD
		
		vscode.workspace.onDidOpenTextDocument(this.triggerLint, this, subscriptions);
		vscode.workspace.onDidCloseTextDocument((textDocument)=> {
=======

		vscode.workspace.onDidOpenTextDocument(this.triggerLint, this, subscriptions);
		vscode.workspace.onDidCloseTextDocument((textDocument) => {
>>>>>>> upstream/master
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

<<<<<<< HEAD
	private loadConfiguration(resource: vscode.Uri): void {
		let oldExecutable = this.linterConfiguration && this.linterConfiguration.executable;
		this.linterConfiguration = this.linter.loadConfiguration(resource);
		
=======
	private async loadConfiguration(resource: vscode.Uri): Promise<void> {
		const oldExecutable = this.linterConfiguration && this.linterConfiguration.executable;
		this.linterConfiguration = await this.linter.loadConfiguration(resource);

>>>>>>> upstream/master
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
<<<<<<< HEAD
		}		
=======
		}
>>>>>>> upstream/master
		this.documentListener = vscode.workspace.onDidSaveTextDocument(this.triggerLint, this);
		// Configuration has changed. Reevaluate all documents.
	}

	private async triggerLint(textDocument: vscode.TextDocument): Promise<void> {
<<<<<<< HEAD
		if (Configuration.getLinterDisabled()) {
			return;
		}

		if (!(await this.python.checkPython(textDocument.uri, false)) || !(await this.python.checkLinter(textDocument.uri, false, false))) {
			return;
		}

		const currentFolder = Configuration.GetRootPath(textDocument.uri);
		if (this.linterConfiguration === null || (currentFolder && this.linterConfiguration.rootPath !== currentFolder)) {
			this.loadConfiguration(textDocument.uri);
		}

		if (textDocument.languageId !== this.linter.languageId || 
			textDocument.uri.scheme !== "file" ||
=======

		const currentFolder = Configuration.GetRootPath(textDocument.uri);
		if (this.linterConfiguration === null || (currentFolder && this.linterConfiguration.rootPath !== currentFolder)) {
			await this.loadConfiguration(textDocument.uri);
		}

		if (textDocument.languageId !== this.linter.languageId ||
			textDocument.uri.scheme !== 'file' ||
>>>>>>> upstream/master
			this.executableNotFound ||
			RunTrigger.from(this.linterConfiguration.runTrigger) === RunTrigger.off) {
			return;
		}

<<<<<<< HEAD
		let key = textDocument.uri.toString();
		let delayer = this.delayers[key];
		if (!delayer) {
			delayer = new ThrottledDelayer<void>(RunTrigger.from(this.linterConfiguration.runTrigger) === RunTrigger.onType ? 250 : 0);
=======
		const key = textDocument.uri.toString();
		let delayer = this.delayers[key];
		if (!delayer) {
			delayer = new ThrottledDelayer<void>(RunTrigger.from(this.linterConfiguration.runTrigger)
                === RunTrigger.onType ? 250 : 0);
>>>>>>> upstream/master
			this.delayers[key] = delayer;
		}
		delayer.trigger(() => this.doLint(textDocument) );
	}

<<<<<<< HEAD
	private doLint(textDocument: vscode.TextDocument): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			let executable = this.linterConfiguration.executable;
			let decoder = new LineDecoder();
			let diagnostics: vscode.Diagnostic[] = [];
			const file = '"' + textDocument.fileName + '"';
			const rootPath = Configuration.GetRootPath(textDocument.uri);
			let options = rootPath ? { rootPath, shell: true } : undefined;
=======
	private async doLint(textDocument: vscode.TextDocument): Promise<void> {
		if (Configuration.getLinterDisabled()) {
			return;
		}

		if (!(await this.python.checkPython(textDocument.uri, false)) || !(await this.python.checkLinter(textDocument.uri, false, false))) {
			return;
		}

		return new Promise<void>((resolve, reject) => {
			const executable = this.linterConfiguration.executable;
			const decoder = new LineDecoder();
			let diagnostics: vscode.Diagnostic[] = [];
			const file = '"' + textDocument.fileName + '"';
			const rootPath = Configuration.GetRootPath(textDocument.uri);
			const options = rootPath ? { rootPath, shell: true } : undefined;
>>>>>>> upstream/master
			let args: string[] = [];
			args = args.concat(this.linterConfiguration.module);
			if (RunTrigger.from(this.linterConfiguration.runTrigger) === RunTrigger.onSave) {
				args = args.concat(this.linterConfiguration.fileArgs.slice(0));
				args.push(file);
			} else {
				args.push(file);
			}
			args = args.concat(this.linterConfiguration.extraArgs);
<<<<<<< HEAD
			
			let childProcess = cp.spawn(executable, args, options);
			this.logger.log(`Execute linting: ${executable} ${args.join(' ')} in ${rootPath}.`)
=======

			const childProcess = cp.spawn(executable, args, options);
			this.logger.log(`[linter] Execute: ${executable} ${args.join(' ')} in ${rootPath}.`);
>>>>>>> upstream/master
			childProcess.on('error', (error: Error) => {
				if (this.executableNotFound) {
					resolve();
					return;
				}
				let message: string = null;
<<<<<<< HEAD
				if ((<any>error).code === 'ENOENT') {
=======
				if ((error as any).code === 'ENOENT') {
>>>>>>> upstream/master
					message = `Cannot lint ${textDocument.fileName}. The executable '${executable}' was not found. Use the '${this.linter.languageId}.linter.executablePath' setting to configure the location of the executable`;
				} else {
					message = error.message ? error.message : `Failed to run executable using path: ${executable}. Reason is unknown.`;
				}
<<<<<<< HEAD
				this.logger.log(message);
=======
				this.logger.log(`[linter] ${message}`);
>>>>>>> upstream/master
				vscode.window.showInformationMessage(message);
				this.executableNotFound = true;
				resolve();
			});
<<<<<<< HEAD
			
			let onDataEvent = (data:Buffer) => { decoder.write(data) };
			let onEndEvent = () => {
				decoder.end();
				let lines = decoder.getLines();
=======

			const onDataEvent = (data: Buffer) => { decoder.write(data); };
			const onEndEvent = () => {
				decoder.end();
				const lines = decoder.getLines();
>>>>>>> upstream/master
				if (lines && lines.length > 0) {
					diagnostics = this.linter.process(lines);
				}
				this.diagnosticCollection.set(textDocument.uri, diagnostics);
				resolve();
<<<<<<< HEAD
			}
			
=======
			};

>>>>>>> upstream/master
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
<<<<<<< HEAD
}
=======
}
>>>>>>> upstream/master
