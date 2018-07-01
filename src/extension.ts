"use strict";
import * as vscode from "vscode";
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient';

import * as RstLanguageServer from './rstLsp/extension';
import * as util from './common';
import RstLintingProvider from './features/rstLinter';
import RstDocumentContentProvider from './features/rstDocumentContent';
import { underline } from './features/underline';
import * as path from "path";
import { Configuration } from "./features/utils/configuration";
import { Logger } from "./logger";
import { ExtensionDownloader } from "./ExtensionDownloader";
import RstTransformerStatus from "./features/utils/statusBar";

let _channel: vscode.OutputChannel = null;

export async function activate(context: vscode.ExtensionContext): Promise<{ initializationFinished: Promise<void> }> {

    const extensionId = 'lextudio.restructuredtext';
    const extension = vscode.extensions.getExtension(extensionId);

    util.setExtensionPath(extension.extensionPath);

    _channel = vscode.window.createOutputChannel("reStructuredText");

    _channel.appendLine("Please visit https://www.restructuredtext.net to learn how to configure the extension.");
    _channel.appendLine("The troubleshooting guide can be found at https://www.restructuredtext.net/en/latest/articles/troubleshooting.html.");
    _channel.appendLine("");
    _channel.appendLine("");
    let logger = new Logger(text => _channel.append(text));

    var disableLsp = Configuration.loadAnySetting("languageServer.disabled", true);
    //*
    if (!disableLsp) {
        Configuration.setRoot();
        let runtimeDependenciesExist = await ensureRuntimeDependencies(extension, logger);
    }
    //*/

    // activate language services
    let rstLspPromise = RstLanguageServer.activate(context, _channel, disableLsp);

    // Status bar to show the active rst->html transformer configuration
    let status = new RstTransformerStatus();

    // The reStructuredText preview provider
    let provider = new RstDocumentContentProvider(context, _channel, status);
    let registration = vscode.workspace.registerTextDocumentContentProvider("restructuredtext", provider);

    // Hook up the provider to user commands
    let d1 = vscode.commands.registerCommand("restructuredtext.showPreview", showPreview);
    let d2 = vscode.commands.registerCommand("restructuredtext.showPreviewToSide", uri => showPreview(uri, true));
    let d3 = vscode.commands.registerCommand("restructuredtext.showSource", showSource);

    context.subscriptions.push(d1, d2, d3, registration);
    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('restructuredtext.features.underline.underline', underline)
    );

    // Hook up the status bar to document change events
    vscode.commands.registerCommand("restructuredtext.resetRstTransformer",
        provider.resetRstTransformerConfig, provider);
    vscode.window.onDidChangeActiveTextEditor(status.update, status, context.subscriptions);
    status.update();

    let linter = new RstLintingProvider();
    linter.activate(context.subscriptions);

    vscode.workspace.onDidSaveTextDocument(document => {
        if (isRstFile(document)) {
            const uri = getRstUri(document.uri);
            provider.update(uri);
        }
    });

    let updateOnTextChanged = Configuration.loadSetting("updateOnTextChanged", "true");
    if (updateOnTextChanged === 'true') {
        vscode.workspace.onDidChangeTextDocument(event => {
            if (isRstFile(event.document)) {
                const uri = getRstUri(event.document.uri);
                provider.update(uri);
            }
        });
    }

    vscode.workspace.onDidChangeConfiguration(() => {
        vscode.workspace.textDocuments.forEach(document => {
            if (document.uri.scheme === 'restructuredtext') {
                // update all generated md documents
                provider.update(document.uri);
            }
        });
    });

    return {
        initializationFinished: Promise.all([rstLspPromise])
            .then(promiseResult => {
                // This promise resolver simply swallows the result of Promise.all. When we decide we want to expose this level of detail
                // to other extensions then we will design that return type and implement it here.
            })
    };
}

function ensureRuntimeDependencies(extension: vscode.Extension<any>, logger: Logger): Promise<boolean> {
    return util.installFileExists(util.InstallFileType.Lock)
        .then(exists => {
            if (!exists) {
                const downloader = new ExtensionDownloader(_channel, logger, extension.packageJSON);
                return downloader.installRuntimeDependencies();
            } else {
                return true;
            }
        });
}

function isRstFile(document: vscode.TextDocument) {
    return document.languageId === 'restructuredtext'
        && document.uri.scheme !== 'restructuredtext'; // prevent processing of own documents
}

function getRstUri(uri: vscode.Uri) {
    return uri.with({ scheme: 'restructuredtext', path: uri.path + '.rendered', query: uri.toString() });
}

function showPreview(uri?: vscode.Uri, sideBySide: boolean = false) {
    let resource = uri;
    if (!(resource instanceof vscode.Uri)) {
        if (vscode.window.activeTextEditor) {
            // we are relaxed and don't check for markdown files
            resource = vscode.window.activeTextEditor.document.uri;
        }
    }

    if (!(resource instanceof vscode.Uri)) {
        if (!vscode.window.activeTextEditor) {
            // this is most likely toggling the preview
            return vscode.commands.executeCommand('restructuredtext.showSource');
        }
        // nothing found that could be shown or toggled
        return;
    }

    let thenable = vscode.commands.executeCommand('vscode.previewHtml',
        getRstUri(resource),
        getViewColumn(sideBySide),
        `Preview '${path.basename(resource.fsPath)}'`);

    return thenable;
}

function getViewColumn(sideBySide): vscode.ViewColumn {
    const active = vscode.window.activeTextEditor;
    if (!active) {
        return vscode.ViewColumn.One;
    }

    if (!sideBySide) {
        return active.viewColumn;
    }

    switch (active.viewColumn) {
        case vscode.ViewColumn.One:
            return vscode.ViewColumn.Two;
        case vscode.ViewColumn.Two:
            return vscode.ViewColumn.Three;
    }

    return active.viewColumn;
}

function showSource(mdUri: vscode.Uri) {
    if (!mdUri) {
        return vscode.commands.executeCommand('workbench.action.navigateBack');
    }

    const docUri = vscode.Uri.parse(mdUri.query);

    for (let editor of vscode.window.visibleTextEditors) {
        if (editor.document.uri.toString() === docUri.toString()) {
            return vscode.window.showTextDocument(editor.document, editor.viewColumn);
        }
    }

    return vscode.workspace.openTextDocument(docUri).then(doc => {
        return vscode.window.showTextDocument(doc);
    });
}

// this method is called when your extension is deactivated
export function deactivate() {
}
