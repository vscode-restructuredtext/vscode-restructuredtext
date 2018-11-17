/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { CommandManager } from './commandManager';
import * as commands from './commands/index';
import { RSTContentProvider } from './features/previewContentProvider';
import { RSTPreviewManager } from './features/previewManager';
import { Logger1 } from './logger1';
import { ExtensionContentSecurityPolicyArbiter, PreviewSecuritySelector } from './security';
import { Python } from './python';
import { RSTEngine } from './rstEngine';

let extensionPath = "";

export function getExtensionPath(): string {
	return extensionPath;
}

export async function activate(context: vscode.ExtensionContext) {
	extensionPath = context.extensionPath;

	const cspArbiter = new ExtensionContentSecurityPolicyArbiter(context.globalState, context.workspaceState);
	const logger = new Logger1();

	const python: Python = new Python(logger);
	await python.awaitReady();
	const engine: RSTEngine = new RSTEngine(python, logger);

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
}
