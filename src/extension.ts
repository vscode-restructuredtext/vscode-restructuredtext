/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import {CommandManager} from './util/commandManager';
import * as commands from './commands/index';
import { Commands } from './constants';
import {Logger} from './util/logger';
import {Python} from './util/python';
import {Configuration} from './util/configuration';
import * as EditorFeatures from './editor/extension';
import * as LinterFeatures from './linter/extension';
import {setGlobalState, setWorkspaceState} from './util/stateUtils';
import {initConfig} from './util/config';
import container from './inversify.config';
import {NAMES, TYPES} from './types';
import {updateActivationCount} from './rating';

let extensionPath = '';

export function getExtensionPath(): string {
    return extensionPath;
}

export async function activate(
    context: vscode.ExtensionContext
): Promise<void> {
    setGlobalState(context.globalState);
    setWorkspaceState(context.workspaceState);

    await initConfig(context);

    extensionPath = context.extensionPath;

    const logger = container.getNamed<Logger>(TYPES.Logger, NAMES.Main);
    const extensionName =
        context.extension.packageJSON?.displayName || 'reStructuredText';
    const extensionId = context.extension.id;
    const extensionVersion =
        context.extension.packageJSON?.version || 'unknown';
    logger.info(
        `Loaded extension "${extensionName}" (${extensionId}) in ${vscode.env.appName}.`
    );
    logger.info(`Version: ${extensionVersion}`);
    await logger.logPlatform();
    logger.info(
        'Please visit https://docs.restructuredtext.net to learn how to configure the extension.'
    );

    await EditorFeatures.activate(context);

    const configuration = container.get<Configuration>(TYPES.Configuration);
    // Check for conflicting extensions now and whenever the extensions list changes
    const checkConflicts = () => {
        const conflicting = configuration.getConflictingExtensions();
        for (const element of conflicting) {
            const found = vscode.extensions.getExtension(element);
            if (found) {
                const message = `Found conflicting extension ${
                    found.packageJSON?.displayName || 'Unknown'
                } (${element}). You have to uninstall it.`;
                logger.warning(message);
                logger.show();
            }
        }
    };

    checkConflicts();
    context.subscriptions.push(
        vscode.extensions.onDidChange(() => {
            // Some extensions may load/activate after us — re-check conflicts
            checkConflicts();
        })
    );

    const recommended = configuration.getRecommendedExtensions();
    if (recommended) {
        // collect extensions that are not installed
        const missing = recommended.filter((element) => !vscode.extensions.getExtension(element.id));
        if (missing.length > 0 && !configuration.getPythonRecommendationDisabled()) {
            const names = missing.map((e) => e.name || e.id).join(', ');
            const prompt = `We recommend installing: ${names}. Install all or review individually?`;
            const installAll = 'Install All';
            const reviewOne = 'Review One By One';
            const dismiss = 'Dismiss';
            const initialChoice = await vscode.window.showInformationMessage(
                prompt,
                installAll,
                reviewOne,
                dismiss
            );

            if (initialChoice === installAll) {
                for (const element of missing) {
                    const reason = getRecommendationReason(element.id);
                    const messageToShow = reason
                        ? `Installing ${element.name || element.id}. ${reason}`
                        : `Installing ${element.name || element.id}.`;
                    logger.info(messageToShow);
                    await vscode.commands.executeCommand(Commands.INSTALL_EXTENSION, element.id);
                }
            } else if (initialChoice === reviewOne) {
                for (const element of missing) {
                    const base = `This extension is designed to work better if you install ${element.name || 'Unknown'} (${element.id}).`;
                    const reason = getRecommendationReason(element.id);
                    const messageToShow = reason ? `${base} ${reason}` : base;
                    logger.info(messageToShow);
                    logger.show();

                    const openLabel = 'Open Extension';
                    const installLabel = 'Install Extension';
                    const skipLabel = 'Skip';
                    const choice = await vscode.window.showInformationMessage(
                        messageToShow,
                        openLabel,
                        installLabel,
                        skipLabel
                    );

                    if (choice === openLabel) {
                        await vscode.commands.executeCommand(Commands.OPEN_EXTENSION, element.id);
                    } else if (choice === installLabel) {
                        await vscode.commands.executeCommand(Commands.INSTALL_EXTENSION, element.id);
                    }
                }
            }
        }
    }

    const commandManager = new CommandManager();
    context.subscriptions.push(commandManager);
    commandManager.register(new commands.MoveCursorToPositionCommand());
    commandManager.register(new commands.OpenDocumentLinkCommand());

    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(() => {
            logger.updateConfiguration();
        })
    );

    await updateActivationCount(context);

    // Initialize platform-specific components
    if (vscode.env.uiKind === vscode.UIKind.Desktop) {
        // Node.js specific initialization
        await activateNodeFeatures(context, logger);
    } else {
        // Web-specific initialization
        await activateWebFeatures(context, logger);
        vscode.window.showInformationMessage(
            'reStructuredText extension running in web mode with limited features'
        );
    }
}

async function activateNodeFeatures(
    context: vscode.ExtensionContext,
    logger: Logger
): Promise<void> {
    // Initialize node-specific features, like linters that require file system access
    const python = container.get<Python>(TYPES.Python);
    await python.setup();

    await LinterFeatures.activate(context, python, logger);
}

async function activateWebFeatures(
    context: vscode.ExtensionContext,
    logger: Logger
): Promise<void> {
    // Initialize web-compatible features only
    logger.warning(
        'Running in web mode - some features like linting are disabled'
    );
    // ...web-specific initialization...
}
