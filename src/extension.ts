/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { CommandManager } from './util/commandManager';
import * as commands from './commands/index';
import { RSTContentProvider } from './preview/previewContentProvider';
import { RSTPreviewManager } from './preview/previewManager';
import { Logger } from './util/logger';
import { Python } from './util/python';
import { RSTEngine } from './preview/rstEngine';
import { ExtensionContentSecurityPolicyArbiter, PreviewSecuritySelector } from './util/security';

import * as listEditing from './editor/listEditing';
import RstLintingProvider from './linter/rstLinter';
import { underline } from './editor/underline';
import { Configuration } from './util/configuration';
import RstTransformerStatus from './preview/statusBar';
import * as RstLanguageServer from './language-server/extension';
import { setGlobalState, setWorkspaceState } from './util/stateUtils';
import { initConfig } from './util/config';
import { TableEditor } from './editor/tableEditor';
import { key_alt_enter, key_enter, key_shift_enter, key_shift_tab, key_tab } from './editor/commands';
import { setContext } from './editor/setContext';

let extensionPath = '';

export function getExtensionPath(): string {
    return extensionPath;
}

export async function activate(context: vscode.ExtensionContext): Promise<{ initializationFinished: Promise<void> }> {

    setGlobalState(context.globalState);
    setWorkspaceState(context.workspaceState);

    await initConfig(context);

    extensionPath = context.extensionPath;

    const logger = new Logger();
    logger.log('Please visit https://docs.restructuredtext.net to learn how to configure the extension.');

    const conflicting = Configuration.getConflictingExtensions();
    for (const element of conflicting) {
        const found = vscode.extensions.getExtension(element);
        if (found) {
            const message = `Found conflicting extension ${element}. Please uninstall it.`;
            logger.log(message);
            vscode.window.showErrorMessage(message);
        }
    }

    const simpleRst = vscode.extensions.getExtension('trond-snekvik.simple-rst');
    if (!simpleRst && !Configuration.getSyntaxHighlightingDisabled()) {
        const message = 'Syntax highlighting is now provided by Trond Snekvik\'s extension. Do you want to install it now?';
        const choice = await vscode.window.showInformationMessage(message, 'Install', 'Not now', 'Do not show again');
        if (choice === 'Install') {
            logger.log('Started to install simple-rst...');
            await vscode.commands.executeCommand('extension.open', 'trond-snekvik.simple-rst');
            await vscode.commands.executeCommand('workbench.extensions.installExtension', 'trond-snekvik.simple-rst');
        } else if (choice === 'Do not show again') {
            logger.log('Disabled syntax highlighting.');
            await Configuration.setSyntaxHighlightingDisabled();
            vscode.window.showWarningMessage('Syntax highlighting is now disabled.');
        } else {
            vscode.window.showWarningMessage('No Syntax highlighting. Trond Snekvik\'s extension is not installed.');
        }
    }

    await logPlatform(logger);
    const disableLsp = Configuration.getLanguageServerDisabled();

    const python: Python = new Python(logger);

    // activate language services
    const rstLspPromise = RstLanguageServer.activate(context, logger, disableLsp, python);

    // Run it once the first time.
    setContext();
    vscode.workspace.onDidCloseTextDocument((event) => {
        setContext();
    })
    vscode.window.onDidChangeActiveTextEditor((event) => {
        setContext();
    })
    vscode.window.onDidChangeTextEditorSelection((event) => {
        setContext();
    })

    // Section creation support.
    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('restructuredtext.features.underline.underline', underline),
        vscode.commands.registerTextEditorCommand('restructuredtext.features.underline.underlineReverse',
            (textEditor, edit) => underline(textEditor, edit, true)),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('resttext.table.createGrid', () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) { return }
            const table = new TableEditor(editor);
            table.createEmptyGrid();
        }));

    context.subscriptions.push(
        vscode.commands.registerCommand('resttext.table.dataToTable', () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) { return }
            const table = new TableEditor(editor);
            table.dataToTable();
        }));

    context.subscriptions.push(
        vscode.commands.registerCommand('resttext.key.enter', () => {
            key_enter();
        }));

    context.subscriptions.push(
        vscode.commands.registerCommand('resttext.key.shift.enter', () => {
            key_shift_enter();
        }));

    context.subscriptions.push(
        vscode.commands.registerCommand('resttext.key.alt.enter', () => {
            key_alt_enter();
        }));

    context.subscriptions.push(
        vscode.commands.registerCommand('resttext.key.tab', () => {
            key_tab();
        }));

    context.subscriptions.push(
        vscode.commands.registerCommand('resttext.key.shift.tab', () => {
            key_shift_tab();
        }));

    // Linter support
    if (!Configuration.getLinterDisabled()) {
        const linter = new RstLintingProvider(logger, python);
        linter.activate(context.subscriptions);
    }

    if (!Configuration.getDocUtilDisabled() || !Configuration.getSphinxDisabled()) {
        // Status bar to show the active rst->html transformer configuration
        const status = new RstTransformerStatus(python, logger);

        // Hook up the status bar to document change events
        context.subscriptions.push(
            vscode.commands.registerCommand('restructuredtext.resetStatus',
                status.reset, status),
        );

        vscode.window.onDidChangeActiveTextEditor(status.update, status, context.subscriptions);
        status.update();

        const cspArbiter = new ExtensionContentSecurityPolicyArbiter(context.globalState, context.workspaceState);

        const engine: RSTEngine = new RSTEngine(python, logger, status);

        const contentProvider = new RSTContentProvider(context, cspArbiter, engine, logger);
        const previewManager = new RSTPreviewManager(contentProvider, logger);
        context.subscriptions.push(previewManager);

        const previewSecuritySelector = new PreviewSecuritySelector(cspArbiter, previewManager);

        const commandManager = new CommandManager();
        context.subscriptions.push(commandManager);
        commandManager.register(new commands.ShowPreviewCommand(previewManager, python));
        commandManager.register(new commands.ShowPreviewToSideCommand(previewManager, python));
        commandManager.register(new commands.ShowLockedPreviewToSideCommand(previewManager, python));
        commandManager.register(new commands.ShowSourceCommand(previewManager));
        commandManager.register(new commands.RefreshPreviewCommand(previewManager));
        commandManager.register(new commands.MoveCursorToPositionCommand());
        commandManager.register(new commands.ShowPreviewSecuritySelectorCommand(previewSecuritySelector, previewManager));
        commandManager.register(new commands.OpenDocumentLinkCommand());
        commandManager.register(new commands.ToggleLockCommand(previewManager));

        context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(() => {
            logger.updateConfiguration();
            previewManager.updateConfiguration();
        }));
    }

    listEditing.activate(context);

    return {
        initializationFinished: Promise.all([rstLspPromise])
            .then((promiseResult) => {
                // This promise resolver simply swallows the result of Promise.all.
                // When we decide we want to expose this level of detail
                // to other extensions then we will design that return type and implement it here.
            }),
    };
}

async function logPlatform(logger: Logger): Promise<void> {
    const os = require('os');
    let platform = os.platform();
    logger.log(`OS is ${platform}`);
    if (platform === 'darwin' || platform === 'win32') {
        return;
    }

    const osInfo = require('linux-os-info');
    const result = await osInfo();
    const dist = result.id;
    logger.log(`dist: ${dist}`);
}
