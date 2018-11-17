'use strict';

import * as vscode from 'vscode';
import * as util from './common';
import { ExtensionDownloader } from './ExtensionDownloader';
import RstLintingProvider from './features/rstLinter';
import { underline } from './features/underline';
import { Configuration } from './features/utils/configuration';
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

    // Hook up the provider to user commands
    const d3 = vscode.commands.registerCommand('restructuredtext.showSource', showSource);

    context.subscriptions.push(d3);
    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('restructuredtext.features.underline.underline', underline),
        vscode.commands.registerTextEditorCommand('restructuredtext.features.underline.underlineReverse',
            (textEditor, edit) => underline(textEditor, edit, true)),
    );

    const linter = new RstLintingProvider();
    linter.activate(context.subscriptions);

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
