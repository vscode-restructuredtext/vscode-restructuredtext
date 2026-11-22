import * as vscode from 'vscode';

import {ThrottledDelayer} from '../util/async';
import {Configuration} from '../util/configuration';
import {Logger} from '../util/logger';
import {getWebPythonService} from '../web/pythonService';
import {parseLinterOutput} from './rstLinter';
import container from '../inversify.config';
import {TYPES} from '../types';

export type WebLinterName = 'doc8' | 'rst-lint' | 'rstcheck';

export class WebLintingProvider implements vscode.Disposable {
    private readonly collection: vscode.DiagnosticCollection;
    private readonly disposables: vscode.Disposable[] = [];
    private readonly delayers = new Map<string, ThrottledDelayer<void>>();

    public constructor(
        private readonly tool: WebLinterName,
        private readonly getExtraArgs: (
            resource: vscode.Uri
        ) => string[] | undefined,
        private readonly logger: Logger
    ) {
        this.collection = vscode.languages.createDiagnosticCollection(tool);
    }

    public activate(subscriptions: vscode.Disposable[]): void {
        this.disposables.push(
            vscode.workspace.onDidOpenTextDocument(document =>
                this.trigger(document, false)
            ),
            vscode.workspace.onDidSaveTextDocument(document =>
                this.trigger(document, false)
            ),
            vscode.workspace.onDidChangeTextDocument(event =>
                this.trigger(event.document, true)
            ),
            vscode.workspace.onDidCloseTextDocument(document => {
                const key = document.uri.toString();
                this.delayers.get(key)?.cancel();
                this.delayers.delete(key);
                this.collection.delete(document.uri);
            })
        );
        subscriptions.push(this);
    }

    public dispose(): void {
        this.collection.dispose();
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables.length = 0;
    }

    private trigger(document: vscode.TextDocument, fromEdit: boolean): void {
        if (document.languageId !== 'restructuredtext') {
            return;
        }

        const configuration = container.get<Configuration>(TYPES.Configuration);
        const runTrigger = configuration.getRunType(document.uri);
        if (runTrigger === 'off') {
            return;
        }
        if (fromEdit && runTrigger !== 'onType') {
            return;
        }

        const key = document.uri.toString();
        let delayer = this.delayers.get(key);
        if (!delayer) {
            delayer = new ThrottledDelayer<void>(250);
            this.delayers.set(key, delayer);
        }
        delayer.trigger(() => this.lint(document));
    }

    private async lint(document: vscode.TextDocument): Promise<void> {
        try {
            const configuration = container.get<Configuration>(
                TYPES.Configuration
            );
            const extraArgs = (this.getExtraArgs(document.uri) ?? []).map(
                value => configuration.expandMacro(value, document.uri)
            );
            const result = await getWebPythonService().lint(
                this.tool,
                document.getText(),
                extraArgs
            );
            const lines = `${result.stdout}\n${result.stderr}`.split(/\r?\n/);
            this.collection.set(
                document.uri,
                parseLinterOutput(this.tool, lines)
            );
        } catch (error) {
            this.logger.error(
                `Web ${this.tool} lint failed: ${
                    error instanceof Error ? error.message : String(error)
                }`
            );
        }
    }
}
