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

    let provider = new RstDocumentContentProvider(context);
    let registration = workspace.registerTextDocumentContentProvider("restructuredtext", provider);
    
    let d1 = commands.registerCommand("restructuredtext.showPreview", showPreview);
    let d2 = commands.registerCommand("restructuredtext.showPreviewToSide", uri => showPreview(uri, true));
    let d3 = commands.registerCommand("restructuredtext.showSource", showSource);

    context.subscriptions.push(d1, d2, registration);

    workspace.onDidSaveTextDocument(document => {
        if (isRstFile(document)) {
            const uri = getRstUri(document.uri);
            provider.update(uri);
        }
    });

    workspace.onDidChangeTextDocument(event => {
        if (isRstFile(event.document)) {
            const uri = getRstUri(event.document.uri);
            provider.update(uri);
        }
    });

    workspace.onDidChangeConfiguration(() => {
		workspace.textDocuments.forEach(document => {
			if (document.uri.scheme === 'restructuredtext') {
				// update all generated md documents
				provider.update(document.uri);
			}
		});
	});
}

function isRstFile(document: TextDocument) {
	return document.languageId === 'restructuredtext'
		&& document.uri.scheme !== 'restructuredtext'; // prevent processing of own documents
}

function getRstUri(uri: Uri) {
	return uri.with({ scheme: 'restructuredtext', path: uri.path + '.rendered', query: uri.toString() });
}

function showPreview(uri?: Uri, sideBySide: boolean = false) {
    let resource = uri;
	if (!(resource instanceof Uri)) {
		if (window.activeTextEditor) {
			// we are relaxed and don't check for markdown files
			resource = window.activeTextEditor.document.uri;
		}
	}

	if (!(resource instanceof Uri)) {
		if (!window.activeTextEditor) {
			// this is most likely toggling the preview
			return commands.executeCommand('restructuredtext.showSource');
		}
		// nothing found that could be shown or toggled
		return;
	}

    let thenable = commands.executeCommand('vscode.previewHtml',
		getRstUri(resource),
		getViewColumn(sideBySide),
		`Preview '${path.basename(resource.fsPath)}'`);

	return thenable;
}

function getViewColumn(sideBySide): ViewColumn {
	const active = window.activeTextEditor;
	if (!active) {
		return ViewColumn.One;
	}

	if (!sideBySide) {
		return active.viewColumn;
	}

	switch (active.viewColumn) {
		case ViewColumn.One:
			return ViewColumn.Two;
		case ViewColumn.Two:
			return ViewColumn.Three;
	}

	return active.viewColumn;
}

function showSource(mdUri: Uri) {
	if (!mdUri) {
		return commands.executeCommand('workbench.action.navigateBack');
	}

	const docUri = Uri.parse(mdUri.query);

	for (let editor of window.visibleTextEditors) {
		if (editor.document.uri.toString() === docUri.toString()) {
			return window.showTextDocument(editor.document, editor.viewColumn);
		}
	}

	return workspace.openTextDocument(docUri).then(doc => {
		return window.showTextDocument(doc);
	});
}

// this method is called when your extension is deactivated
export function deactivate() {
}

class RstDocumentContentProvider implements TextDocumentContentProvider {
    private _context: ExtensionContext;
    private _onDidChange = new EventEmitter<Uri>();
    private _waiting: boolean;
    private _containerPath: string;

    constructor(context: ExtensionContext) {
        this._context = context;
        this._waiting = false;
        this._containerPath = path.dirname(this.absoluteConfiguredPath("confPath", "conf.py"));
    }

    public provideTextDocumentContent(uri: Uri): string | Thenable<string> {
        return this.createRstSnippet();
    }

    get onDidChange(): Event<Uri> {
        return this._onDidChange.event;
    }

	public update(uri: Uri) {
		if (!this._waiting) {
			this._waiting = true;
			setTimeout(() => {
				this._waiting = false;
				this._onDidChange.fire(uri);
			}, 300);
		}
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

    /**
     * Return absolute path for passed *configSection* driven path.
     * 
     * If *configSection* value not defined then use *defaultValue instead when 
     * computing absolute path.
     */
    private absoluteConfiguredPath(
        configSection: string, defaultValue: string
    ): string {
        return path.join(
            workspace.rootPath,
            workspace.getConfiguration("restructuredtext").get(
                configSection, defaultValue
            )
        );
    }

    /**
     * Return *whole* path relative to documentation conf.py 
     */
    private relativeDocumentationPath(whole: string): string {
        return whole.substring(this._containerPath.length);
    }

    public preview(editor: TextEditor): Thenable<string> {
        // Calculate full path to built html file.
        let whole = editor.document.fileName;
        let ext = whole.lastIndexOf(".");
        whole = whole.substring(0, ext) + ".html";

        let root = this._containerPath;
        let finalName = path.join(
            this.absoluteConfiguredPath("builtDocumentationPath", "_build/html"), 
            this.relativeDocumentationPath(whole)
        );

        // Display file.
        return new Promise<string>((resolve, reject) => {
            let cmd = [
                "make",
                "html"
            ].join(" ");
            exec(cmd, {cwd: root}, (error, stdout, stderr) =>
            {
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
                    return;
                }

                if (stderr) {
                    let errorMessage = stderr.toString();
                    if (errorMessage.indexOf("ERROR:") > -1)
                    {
                        console.error(errorMessage);
                        reject(errorMessage);
                        return;
                    }
                }

                fs.stat(finalName, (error, stat) => {
                    if (error != null) {
                        let errorMessage = [
                            error.name,
                            error.message,
                            error.stack
                        ].join("\n");
                        console.error(errorMessage);
                        reject(errorMessage);
                        return;
                    //} else if(err.code == 'ENOENT') {
                    //    fs.writeFile('log.txt', 'Some log\n');
                    }                       

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
                });
            });           
        });        
    }
}
