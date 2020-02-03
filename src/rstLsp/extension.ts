/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { LanguageClient, ServerOptions, LanguageClientOptions } from 'vscode-languageclient';
import * as path from "path";
import { Logger } from '../logger';

export function activate(context: vscode.ExtensionContext, logger: Logger, disabled: boolean) {
    if (disabled) {
        return;
    }

    // Defines the search path of your language server DLL. (.NET Core)
    const languageServerPaths = [
        ".rst/Server.exe",
        ".rst/Server",
        "../restructuredtext-antlr/Server/bin/Debug/netcoreapp2.0/Server.dll"
    ]

    var fs = require('fs');
    let serverModule: string = null;
    for (let p of languageServerPaths) {
        p = context.asAbsolutePath(p);
        // console.log(p);
        if (fs.existsSync(p)) {
            serverModule = p;
            break;
        }
    }

    if (serverModule != null) {
        let workPath = path.dirname(serverModule);

        // If the extension is launched in debug mode then the debug server options are used
        // Otherwise the run options are used
        let serverOptions: ServerOptions = {
            run: { command: serverModule, args: [], options: { cwd: workPath } },
            debug: { command: serverModule, args: ["--debug"], options: { cwd: workPath } }
        }

        if (serverModule.indexOf(".dll") > -1)
        {
            serverOptions = {
                run: { command: "dotnet", args: [serverModule], options: { cwd: workPath } },
                debug: { command: "dotnet", args: [serverModule, "--debug"], options: { cwd: workPath } }
            }
        }

        // Options to control the language client
        let clientOptions: LanguageClientOptions = {
            // Register the server for plain text documents
            documentSelector: [
                { language: 'restructuredtext', scheme: 'file' },
                { language: 'restructuredtext', scheme: 'untitled' }
            ],
            synchronize: {
                // Synchronize the setting section 'lspSample' to the server
                configurationSection: 'restructuredtext',
                // Notify the server about file changes to '.clientrc' files contain in the workspace
                fileEvents: [
                    vscode.workspace.createFileSystemWatcher('**/conf.py'),
                    vscode.workspace.createFileSystemWatcher("**/.rst"),
                    vscode.workspace.createFileSystemWatcher("**/.rest")
                ]
            }
        }

        // Create the language client and start the client.
        let disposable = new LanguageClient('restructuredtext', 'reStructuredText Language Server', serverOptions, clientOptions).start();

        // Push the disposable to the context's subscriptions so that the
        // client can be deactivated on extension deactivation
        context.subscriptions.push(disposable);  
    }
}
