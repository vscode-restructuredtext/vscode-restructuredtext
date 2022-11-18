/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import {Logger} from '../util/logger';
import {Python} from '../util/python';
import {EsbonioClient} from './client';

export async function activate(
    context: vscode.ExtensionContext,
    logger: Logger,
    python: Python
): Promise<EsbonioClient> {
    if (
        vscode.workspace.workspaceFolders &&
        vscode.workspace.workspaceFolders.length > 1
    ) {
        vscode.window.showWarningMessage(
            'IntelliSense and live preview are not available. Esbonio language server does not support multi-root workspaces.'
        );
        return;
    }

    if (
        !(await python.checkPython(null, false)) ||
        !(await python.checkPythonForEsbonio())
    ) {
        vscode.window.showErrorMessage(
            'Python is not installed, or its version is too old. Esbonio language server requires 3.6 and above.'
        );
        return;
    }

    const esbonio = new EsbonioClient(logger, python, context);
    const config = vscode.workspace.getConfiguration('esbonio.server');
    if (config.get('enabled')) {
        await esbonio.start();
    }

    return esbonio;
}
