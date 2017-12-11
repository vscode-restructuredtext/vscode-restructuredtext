"use strict";
import {
    workspace, window, ExtensionContext, commands,
    Uri, ViewColumn,
    TextDocument, Disposable
} from "vscode";
import RstLintingProvider from './features/rstLinter';
import RstDocumentContentProvider from './features/rstDocumentContent';
import { underline } from './features/underline';
import * as path from "path";
import { Configuration } from "./features/utils/configuration";

export function activate(context: ExtensionContext) {

    let provider = new RstDocumentContentProvider(context);
    let registration = workspace.registerTextDocumentContentProvider("restructuredtext", provider);

    let d1 = commands.registerCommand("restructuredtext.showPreview", showPreview);
    let d2 = commands.registerCommand("restructuredtext.showPreviewToSide", uri => showPreview(uri, true));
    let d3 = commands.registerCommand("restructuredtext.showSource", showSource);

    context.subscriptions.push(d1, d2, d3, registration);
    context.subscriptions.push(
        commands.registerTextEditorCommand('restructuredtext.features.underline.underline', underline)
    );

    let linter = new RstLintingProvider();
    linter.activate(context.subscriptions);

    workspace.onDidSaveTextDocument(document => {
        if (isRstFile(document)) {
            const uri = getRstUri(document.uri);
            provider.update(uri);
        }
    });

    let updateOnTextChanged = Configuration.loadSetting("updateOnTextChanged", "true");
    if (updateOnTextChanged === 'true') {
        workspace.onDidChangeTextDocument(event => {
            if (isRstFile(event.document)) {
                const uri = getRstUri(event.document.uri);
                provider.update(uri);
            }
        });
    }

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
