"use strict";
import { workspace, window, ExtensionContext, commands,
TextEditor, TextDocumentContentProvider, EventEmitter,
Event, Uri, TextDocumentChangeEvent, ViewColumn,
TextEditorSelectionChangeEvent,
TextDocument, Disposable } from "vscode";
import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";
let fileUrl = require("file-url");

export function activate(context: ExtensionContext) {

    let previewUri: Uri;

    let provider: RstDocumentContentProvider;
    let registration: Disposable;

    workspace.onDidChangeTextDocument((e: TextDocumentChangeEvent) => {
        if (e.document === window.activeTextEditor.document) {
            provider.update(previewUri);
        }
    });

    workspace.onDidSaveTextDocument((e: TextDocument) => {
        if (e === window.activeTextEditor.document) {
            provider.update(previewUri);
        }
    });

    function sendHTMLCommand(displayColumn: ViewColumn): PromiseLike<void> {
        let previewTitle = `Preview: '${path.basename(window.activeTextEditor.document.fileName)}'`;
        provider = new RstDocumentContentProvider();
        registration = workspace.registerTextDocumentContentProvider("restructuredtext-preview", provider);
        previewUri = Uri.parse(`restructuredtext-preview://preview/${previewTitle}`);
        return commands.executeCommand("vscode.previewHtml", previewUri, displayColumn).then((success) => {
        }, (reason) => {
            console.warn(reason);
            window.showErrorMessage(reason);
        });
    }

    let previewToSide = commands.registerCommand("restructuredtext.previewToSide", () => {
        let displayColumn: ViewColumn;
        switch (window.activeTextEditor.viewColumn) {
            case ViewColumn.One:
                displayColumn = ViewColumn.Two;
                break;
            case ViewColumn.Two:
            case ViewColumn.Three:
                displayColumn = ViewColumn.Three;
                break;
        }
        return sendHTMLCommand(displayColumn);
    });

    let preview = commands.registerCommand("restructuredtext.preview", () => {
        return sendHTMLCommand(window.activeTextEditor.viewColumn);
    });

    context.subscriptions.push(previewToSide, preview, registration);
}

// this method is called when your extension is deactivated
export function deactivate() {
}

class RstDocumentContentProvider implements TextDocumentContentProvider {
    private _onDidChange = new EventEmitter<Uri>();
    private resultText = "";

    public provideTextDocumentContent(uri: Uri): string | Thenable<string> {
        return this.createRstSnippet();
    }

    get onDidChange(): Event<Uri> {
        return this._onDidChange.event;
    }

    public update(uri: Uri) {
        this._onDidChange.fire(uri);
    }

    private createRstSnippet(): string | Thenable<string> {
        let editor = window.activeTextEditor;
        if (!(editor.document.languageId === "restructuredtext")) {
            return this.errorSnippet("Active editor doesn't show a reStructuredText document - no properties to preview.");
        }
        return this.preview(editor);
    }

    private errorSnippet(error: string): string {
        return `
                <body>
                    ${error}
                </body>`;
    }

    private buildPage(document: string, headerArgs: string[]): string {
        return `
            <html lang="en">
            <head>
            ${headerArgs.join("\n")}
            </head>
            <body>
            ${document}
            </body>
            </html>`;
    }

    private createStylesheet(file: string) {
        let href = fileUrl(
            path.join(
                __dirname,
                "..",
                "..",
                "src",
                "static",
                file
            )
        );
        return `<link href="${href}" rel="stylesheet" />`;
    }

    private fixLinks(document: string, documentPath: string): string {
        return document.replace(
            new RegExp("((?:src|href)=[\'\"])(.*?)([\'\"])", "gmi"), (subString: string, p1: string, p2: string, p3: string): string => {
                return [
                    p1,
                    fileUrl(path.join(
                        path.dirname(documentPath),
                        p2
                    )),
                    p3
                ].join("");
            }
        );
    }

    public preview(editor: TextEditor): Thenable<string> {
        let doc = editor.document;
        return new Promise<string>((resolve, reject) => {
            let cmd = [
                "python",
                path.join(
                    __dirname,
                    "..",
                    "..",
                    "src",
                    "preview.py"
                ),
                doc.fileName
            ].join(" ");
            exec(cmd, (error: Error, stdout: Buffer, stderr: Buffer) => {
                if (error) {
                    let errorMessage = [
                        error.name,
                        error.message,
                        error.stack,
                        "",
                        stderr.toString()
                    ].join("\n");
                    console.error(errorMessage);
                    reject(errorMessage);
                } else {
                    let result = this.fixLinks(stdout.toString(), editor.document.fileName);
                    let headerArgs = [
                        this.createStylesheet("basic.css"),
                        this.createStylesheet("default.css")
                    ];
                    resolve(this.buildPage(result, headerArgs));
                }
            });
        });
    }
}
