'use strict';
import * as path from 'path';
import * as vscode from 'vscode';
import * as util from './common';
import { ExtensionDownloader } from './ExtensionDownloader';
import RstDocumentContentProvider from './features/rstDocumentContent';
import RstLintingProvider from './features/rstLinter';
import { underline } from './features/underline';
import { Configuration } from './features/utils/configuration';
import RstTransformerStatus from './features/utils/statusBar';
import { Logger } from './logger';
import * as RstLanguageServer from './rstLsp/extension';

let _channel: vscode.OutputChannel = null;

export async function activate(context: vscode.ExtensionContext): Promise<{ initializationFinished: Promise<void> }> {

    const extensionId = 'lextudio.restructuredtext';
    const extension = vscode.extensions.getExtension(extensionId);

    util.setExtensionPath(extension.extensionPath);

    _channel = vscode.window.createOutputChannel('reStructuredText');

    _channel.appendLine('Please visit https://www.restructuredtext.net to learn how to configure the extension.');
    _channel.appendLine('');
    _channel.appendLine('');
    const logger = new Logger((text) => _channel.append(text));

    const disableLsp = Configuration.loadAnySetting('languageServer.disabled', true, null);
    // *
    if (!disableLsp) {
        await Configuration.setRoot();
        await ensureRuntimeDependencies(extension, logger);
    }
    // */

    // activate language services
    const rstLspPromise = RstLanguageServer.activate(context, _channel, disableLsp);

    // Status bar to show the active rst->html transformer configuration
    const status = new RstTransformerStatus();

    // The reStructuredText preview provider
    const provider = new RstDocumentContentProvider(context, _channel, status);
    const registration = vscode.workspace.registerTextDocumentContentProvider('restructuredtext', provider);

    // Hook up the provider to user commands
    const d1 = vscode.commands.registerCommand('restructuredtext.showPreview', showPreview);
    const d2 = vscode.commands.registerCommand('restructuredtext.showPreviewToSide',
        async (uri) => await showPreview(uri, true));
    const d3 = vscode.commands.registerCommand('restructuredtext.showSource', showSource);

    context.subscriptions.push(d1, d2, d3, registration);
    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('restructuredtext.features.underline.underline', underline),
    );

    // Hook up the status bar to document change events
    context.subscriptions.push(
        vscode.commands.registerCommand('restructuredtext.resetRstTransformer',
            provider.resetRstTransformerConfig, provider),
    );
    vscode.window.onDidChangeActiveTextEditor(status.update, status, context.subscriptions);
    status.update();

    const linter = new RstLintingProvider();
    linter.activate(context.subscriptions);

    vscode.workspace.onDidOpenTextDocument(async (document) => {
        if (isRstFile(document)) {
            await provider.showStatus(document.uri, status);
        }
    });

    vscode.workspace.onDidSaveTextDocument((document) => {
        if (isRstFile(document)) {
            provider.update(getPreviewUri(document.uri));
        }
    });

    const updateOnTextChanged = Configuration.loadSetting('updateOnTextChanged', 'true', null);
    if (updateOnTextChanged === 'true') {
        vscode.workspace.onDidChangeTextDocument((event) => {
            if (isRstFile(event.document)) {
                provider.update(getPreviewUri(event.document.uri));
            }
        });
    }

    vscode.workspace.onDidChangeConfiguration(() => {
        vscode.workspace.textDocuments.forEach((document) => {
            if (document.uri.scheme === 'restructuredtext') {
                // update all generated md documents
                provider.update(document.uri);
            }
        });
    });

    return {
        initializationFinished: Promise.all([rstLspPromise])
            .then((promiseResult) => {
                // This promise resolver simply swallows the result of Promise.all.
                // When we decide we want to expose this level of detail
                // to other extensions then we will design that return type and implement it here.
            }),
    };
}

function ensureRuntimeDependencies(extension: vscode.Extension<any>, logger: Logger): Promise<boolean> {
    return util.installFileExists(util.InstallFileType.Lock)
        .then((exists) => {
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

async function showPreview(uri?: vscode.Uri, sideBySide: boolean = false) {
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
            return await vscode.commands.executeCommand('restructuredtext.showSource');
        }
        // nothing found that could be shown or toggled
        return;
    }

    const preview = getPreviewUri(resource);
    return await vscode.commands.executeCommand('vscode.previewHtml',
        preview,
        getViewColumn(sideBySide),
        `Preview '${path.basename(preview.fsPath)}'`);
}

function getPreviewUri(uri: vscode.Uri) {
    return uri.with({ scheme: 'restructuredtext', path: uri.path, query: uri.toString() });
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

async function showSource(mdUri: vscode.Uri) {
    if (!mdUri) {
        return await vscode.commands.executeCommand('workbench.action.navigateBack');
    }

    const docUri = vscode.Uri.parse(mdUri.query);

    for (const editor of vscode.window.visibleTextEditors) {
        if (editor.document.uri.toString() === docUri.toString()) {
            return await vscode.window.showTextDocument(editor.document, editor.viewColumn);
        }
    }

    const doc = await vscode.workspace.openTextDocument(docUri);
    return await vscode.window.showTextDocument(doc);
}

// this method is called when your extension is deactivated
// tslint:disable-next-line:no-empty
export function deactivate() {
}
