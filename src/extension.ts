/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import {CommandManager} from './util/commandManager';
import * as commands from './commands/index';
import {Logger} from './util/logger';
import {Python} from './util/python';
import {Configuration} from './util/configuration';
import * as EditorFeatures from './editor/extension';
import * as LinterFeatures from './linter/extension';
import {setGlobalState, setWorkspaceState} from './util/stateUtils';
import {initConfig} from './util/config';
import {Commands} from './constants';
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
    logger.log(
        'Please visit https://docs.restructuredtext.net to learn how to configure the extension.'
    );

    await EditorFeatures.activate(context);

    const configuration = container.get<Configuration>(TYPES.Configuration);
    const conflicting = configuration.getConflictingExtensions();
    for (const element of conflicting) {
        const found = vscode.extensions.getExtension(element);
        if (found) {
            const message = `Found conflicting extension ${found.packageJSON.displayName}(${element}). You have to uninstall it.`;
            logger.log(message);
            logger.show();
        }
    }

    const recommended = configuration.getRecommendedExtensions();
    for (const element of recommended) {
        const found = vscode.extensions.getExtension(element);
        if (!found && !configuration.getPythonRecommendationDisabled()) {
            const message = `This extension depends on ${found.packageJSON.displayName}. You have to install it.`;
            logger.log(message);
            logger.show();
        }
    }

    const minor = require('semver/functions/minor');
    const minorVersion = minor(context.extension.packageJSON.version);
    if (minorVersion % 2 !== 0) {
        await logger.logPlatform(context.extension.packageJSON.version);
    }

    const python = container.get<Python>(TYPES.Python);
    await python.setup();

    await LinterFeatures.activate(context, python, logger);

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
}
