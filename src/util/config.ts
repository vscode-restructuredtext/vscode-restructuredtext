/*---------------------------------------------------------
 * Copyright 2021 The Go Authors. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------*/

import vscode = require('vscode');

export function getConfig(
    section: string,
    uri?: vscode.Uri
): vscode.WorkspaceConfiguration {
    if (!uri) {
        if (vscode.window.activeTextEditor) {
            uri = vscode.window.activeTextEditor.document.uri;
        }
    }
    return vscode.workspace.getConfiguration(section, uri);
}

// True if the extension is running in known cloud-based IDEs.
export const IsInCloudIDE =
    process.env.CLOUD_SHELL === 'true' || process.env.CODESPACES === 'true';
