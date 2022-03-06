/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { Logger } from '../util/logger';
import { Configuration } from '../util/configuration';
import { Python } from '../util/python';
import { EsbonioClient } from './client';

export async function activate(context: vscode.ExtensionContext, channel: vscode.OutputChannel, logger: Logger, python: Python): Promise<void> {

    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 1) {
        vscode.window.showWarningMessage('IntelliSense and live preview are not available. Esbonio language server does not support multi-root workspaces.');
        return;
    }

    if (!(await python.checkPython(null, false)) || !(await python.checkPythonForEsbonio())) {
        vscode.window.showErrorMessage('Python is not installed, or its version is too old. Esbonio language server requires 3.6 and above.');
        return;
    }

    let serverModule: string = await Configuration.getPythonPath();
    let args: string[] = [];
    let options: any = {};
    const sourceFolder = Configuration.getEsbonioSourceFolder();
    if (sourceFolder) {
        // launch language server from source folder.
        options.cwd = sourceFolder;
        if (await python.checkPython(null, false) && await python.checkEsbonio(null, false, false)) {
            await python.uninstallEsbonio();
            vscode.window.showInformationMessage('Uninstalled esbonio.');
        }
        if (!(await python.checkPython(null, false)) || !(await python.checkDebugPy(null, true))) {
            return;
        }
        args.push('-m', 'debugpy', '--listen', '5678');
        if (Configuration.getEsbonioDebugLaunch()) {
            args.push('--wait-for-client');
        }
        vscode.window.showInformationMessage('debugpy is at port 5678. Connect and debug.');
    } else {
        if (!(await python.checkPython(null, false)) || !(await python.checkEsbonio(null, true, true))) {
            return;
        }
    }

    logger.log('Use Esbonio language server');
    args.push('-m', 'esbonio');

    if (serverModule != null) {

        const esbonio = new EsbonioClient(logger, channel, context);
        let config = vscode.workspace.getConfiguration("esbonio.server")
        if (config.get("enabled")) {
            await esbonio.start()
        }
    }
}
