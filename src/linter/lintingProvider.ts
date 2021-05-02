'use strict';

import * as cp from 'child_process';

import * as vscode from 'vscode';

import { Logger } from '../util/logger';
import { Python } from '../util/python';
import { ThrottledDelayer } from '../util/async';
import { Configuration } from '../util/configuration';
import { LineDecoder } from '../util/lineDecoder';

enum RunTrigger {
    onSave,
    onType,
    off,
}

namespace RunTrigger {
    export let strings = {
        off: 'off',
        onSave: 'onSave',
        onType: 'onType',
    };
    export let from = (value: string): RunTrigger => {
        if (value === 'onType') {
            return RunTrigger.onType;
        } else if (value === 'onSave') {
            return RunTrigger.onSave;
        } else {
            return RunTrigger.off;
        }
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
        this.executableNotFound = false;
    }

    public activate(subscriptions: vscode.Disposable[]) {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection();
        subscriptions.push(this);
        vscode.workspace.onDidChangeConfiguration(this.resetConfiguration, this, subscriptions);
        vscode.workspace.onDidSaveTextDocument((textDocument) => {
            if (textDocument.fileName.endsWith('settings.json')) {
                this.resetConfiguration();
            }
        }, null, subscriptions);
        this.resetConfiguration();

        vscode.workspace.onDidOpenTextDocument(this.triggerLint, this, subscriptions);
        vscode.workspace.onDidCloseTextDocument((textDocument) => {
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

    private async loadConfiguration(resource: vscode.Uri): Promise<void> {
        const oldExecutable = this.linterConfiguration && this.linterConfiguration.executable;
        this.linterConfiguration = await this.linter.loadConfiguration(resource);

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

        const currentFolder = Configuration.GetRootPath(textDocument.uri);
        if (this.linterConfiguration === null || (currentFolder && this.linterConfiguration.rootPath !== currentFolder)) {
            await this.loadConfiguration(textDocument.uri);
        }

        if (textDocument.languageId !== this.linter.languageId ||
            textDocument.uri.scheme !== 'file' ||
            this.executableNotFound ||
            RunTrigger.from(this.linterConfiguration.runTrigger) === RunTrigger.off) {
            return;
        }

        const key = textDocument.uri.toString();
        let delayer = this.delayers[key];
        if (!delayer) {
            delayer = new ThrottledDelayer<void>(RunTrigger.from(this.linterConfiguration.runTrigger)
                === RunTrigger.onType ? 250 : 0);
            this.delayers[key] = delayer;
        }
        delayer.trigger(() => this.doLint(textDocument));
    }

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
            const file = process.platform === 'win32'
                ? '"' + textDocument.fileName + '"'
                : textDocument.fileName;
            const rootPath = Configuration.GetRootPath(textDocument.uri);
            const options = rootPath ? { rootPath, shell: true } : undefined;
            let args: string[] = [];
            args = args.concat(this.linterConfiguration.module);
            if (RunTrigger.from(this.linterConfiguration.runTrigger) === RunTrigger.onSave) {
                args = args.concat(this.linterConfiguration.fileArgs.slice(0));
                args.push(file);
            } else {
                args.push(file);
            }
            args = args.concat(this.linterConfiguration.extraArgs);

            const childProcess = cp.spawn(executable, args, options);
            this.logger.log(`[linter] Execute: ${executable} ${args.join(' ')} in ${rootPath}.`);
            childProcess.on('error', (error: Error) => {
                if (this.executableNotFound) {
                    resolve();
                    return;
                }
                let message: string = null;
                if ((error as any).code === 'ENOENT') {
                    message = `Cannot lint ${textDocument.fileName}. The executable '${executable}' was not found. Use the '${this.linter.languageId}.linter.executablePath' setting to configure the location of the executable`;
                } else {
                    message = error.message ? error.message : `Failed to run executable using path: ${executable}. Reason is unknown.`;
                }
                this.logger.log(`[linter] ${message}`);
                vscode.window.showInformationMessage(message);
                this.executableNotFound = true;
                resolve();
            });

            const onDataEvent = (data: Buffer) => { decoder.write(data); };
            const onEndEvent = () => {
                decoder.end();
                const lines = decoder.getLines();
                if (lines && lines.length > 0) {
                    diagnostics = this.linter.process(lines);
                }
                this.diagnosticCollection.set(textDocument.uri, diagnostics);
                resolve();
            };

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
