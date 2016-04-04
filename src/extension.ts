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
        let whole = window.activeTextEditor.document.fileName;
        let previewTitle = `Preview: '${basicName(whole)}'`;
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

function basicName(whole: string): string {
    let ext = whole.lastIndexOf(".");
    let core = whole.substring(0, ext);
    return core.substring(workspace.rootPath.length, core.length);
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
        let whole = editor.document.fileName;
        let finalName = path.join(workspace.rootPath, "_build/html", basicName(whole) + ".html");
        return new Promise<string>((resolve, reject) => {
            fs.stat(finalName, (error, stat) => {
                if (error == null) {
                    fs.readFile(finalName, "utf8", (err, data) => {
                        if (err == null) {
                            let fixed = this.fixLinks(data, finalName);
                            resolve(fixed);
                        } else {
                            let errorMessage = [
                                err.name,
                                err.message,
                                err.stack
                            ].join("\n");
                            console.error(errorMessage);
                            reject(errorMessage);
                        }                        
                    });
                //} else if(err.code == 'ENOENT') {
                //    fs.writeFile('log.txt', 'Some log\n');
                } else {
                    let errorMessage = [
                        error.name,
                        error.message,
                        error.stack
                    ].join("\n");
                    console.error(errorMessage);
                    reject(errorMessage);
                }
            });
        });        
    }
}
