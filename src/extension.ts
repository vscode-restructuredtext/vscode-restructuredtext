/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { CommandManager } from './commandManager';
import * as commands from './commands/index';
import { RSTContentProvider } from './features/previewContentProvider';
import { RSTPreviewManager } from './features/previewManager';
import { Logger } from './logger';
import { ExtensionContentSecurityPolicyArbiter, PreviewSecuritySelector } from './security';
import { Python } from './python';
import { RSTEngine } from './rstEngine';

import * as util from './common';
import { ExtensionDownloader } from './ExtensionDownloader';
import RstLintingProvider from './features/rstLinter';
import { underline } from './features/underline';
import { Configuration } from './features/utils/configuration';
import RstTransformerStatus from './features/utils/statusBar';
import * as RstLanguageServer from './rstLsp/extension';

let extensionPath = "";

export function getExtensionPath(): string {
	return extensionPath;
}

export async function activate(context: vscode.ExtensionContext): Promise<{ initializationFinished: Promise<void> }> {
	extensionPath = context.extensionPath;

	const extensionId = 'lextudio.restructuredtext';
	const extension = vscode.extensions.getExtension(extensionId);

	util.setExtensionPath(context.extensionPath);

	const logger = new Logger();
	logger.log('Please visit https://docs.restructuredtext.net to learn how to configure the extension.');

	const disableLsp = Configuration.getLanguageServerDisabled();
	// *
	if (!disableLsp) {
		await Configuration.setRoot();
		await ensureRuntimeDependencies(extension, logger);
	}
	// */

	// activate language services
	const rstLspPromise = RstLanguageServer.activate(context, logger, disableLsp);

	const python: Python = new Python(logger);
	// Status bar to show the active rst->html transformer configuration
	const status = new RstTransformerStatus(python, logger);

	// Hook up the status bar to document change events
	context.subscriptions.push(
		vscode.commands.registerCommand('restructuredtext.resetStatus',
			status.reset, status),
	);

	vscode.window.onDidChangeActiveTextEditor(status.update, status, context.subscriptions);
	status.update();
	
	// Section creation support.
	context.subscriptions.push(
		vscode.commands.registerTextEditorCommand('restructuredtext.features.underline.underline', underline),
		vscode.commands.registerTextEditorCommand('restructuredtext.features.underline.underlineReverse',
			(textEditor, edit) => underline(textEditor, edit, true)),
	);

	// Linter support
	const linter = new RstLintingProvider(logger);
	linter.activate(context.subscriptions);

	const cspArbiter = new ExtensionContentSecurityPolicyArbiter(context.globalState, context.workspaceState);

	const engine: RSTEngine = new RSTEngine(python, logger, status);

	const contentProvider = new RSTContentProvider(context, cspArbiter, engine, logger);
	const previewManager = new RSTPreviewManager(contentProvider, logger);
	context.subscriptions.push(previewManager);

	const previewSecuritySelector = new PreviewSecuritySelector(cspArbiter, previewManager);

	const commandManager = new CommandManager();
	context.subscriptions.push(commandManager);
	commandManager.register(new commands.ShowPreviewCommand(previewManager));
	commandManager.register(new commands.ShowPreviewToSideCommand(previewManager));
	commandManager.register(new commands.ShowLockedPreviewToSideCommand(previewManager));
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
                const downloader = new ExtensionDownloader(logger, extension.packageJSON);
                return downloader.installRuntimeDependencies();
            } else {
                return true;
            }
        });
}
