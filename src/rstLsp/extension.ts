/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { LanguageClient, ServerOptions, LanguageClientOptions } from 'vscode-languageclient';
import * as path from "path";
import { Logger } from '../logger';
import { DocumentLinkProvider } from './docLinkProvider';
import open = require('open');
import mime = require('mime');

export function activate(context: vscode.ExtensionContext, logger: Logger, disabled: boolean) {
    if (disabled) {
        return;
    }

    // Defines the search path of your language server DLL. (.NET Core)
    const languageServerPaths = [
        ".snooty/snooty/snooty",
        "../restructuredtext-antlr/Server/bin/Debug/netcoreapp3.1/Server.dll",
        ".rst/Server.exe",
        ".rst/Server"
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
            run: { command: serverModule, args: ["language-server"], options: { cwd: workPath } },
            debug: { command: serverModule, args: ["language-server"], options: { cwd: workPath } }
        }

        if (serverModule.indexOf(".dll") > -1)
        {
            serverOptions = {
                run: { command: "dotnet", args: [serverModule], options: { cwd: workPath } },
                debug: { command: "dotnet", args: [serverModule, "--debug"], options: { cwd: workPath } }
            }
        }

        const documentSelector = [
            { language: 'plaintext', scheme: 'file' },
            { language: 'yaml', scheme: 'file' },
            { language: 'restructuredtext', scheme: 'file' },
            { language: 'toml', scheme: 'file' },
        ];
        // Options to control the language client
        let clientOptions: LanguageClientOptions = {
            // Register the server for plain text documents
            documentSelector,
            synchronize: {
                // Synchronize the setting section 'lspSample' to the server
                configurationSection: 'snooty',
                // Notify the server about file changes to '.clientrc' files contain in the workspace
                fileEvents: [
                    vscode.workspace.createFileSystemWatcher('**/*.rst'),
                    vscode.workspace.createFileSystemWatcher('**/*.txt'),
                    vscode.workspace.createFileSystemWatcher('**/*.yaml'),
                    vscode.workspace.createFileSystemWatcher('snooty.toml')
                ]
            }
        }

        const client = new LanguageClient('Snooty Language Client', serverOptions, clientOptions);
        const restartServer = vscode.commands.registerCommand('snooty.restart', async () => {
            await client.stop();
            return client.start();
        });
    
        // Push the disposable to the context's subscriptions so that the
        // client can be deactivated on extension deactivation
        context.subscriptions.push(client.start());
        context.subscriptions.push(restartServer);
    
        // Register custom command to allow includes, literalincludes, and figures to be clickable
        let hoverFile: string;
        const clickInclude: vscode.Disposable = vscode.commands.registerCommand('snooty.clickInclude', async () => {
            // Send request to server (snooty-parser)
            const type = mime.getType(hoverFile);
    
            if (type == null || !type.includes("image")) {
                const textDoc = await vscode.workspace.openTextDocument(hoverFile);
                vscode.window.showTextDocument(textDoc);
            }
            else {
                open(hoverFile);
            }
        });
        context.subscriptions.push(clickInclude);
    
        // Shows clickable link to file after hovering over it
        vscode.languages.registerHoverProvider(
            documentSelector,
            new class implements vscode.HoverProvider {
              provideHover(
                _document: vscode.TextDocument,
                _position: vscode.Position,
                _token: vscode.CancellationToken
              ): vscode.ProviderResult<vscode.Hover> {
                // Get range for a link
                const wordRegex = /\/\S+/;
                const wordRange = _document.getWordRangeAtPosition(_position, wordRegex);
    
                if (wordRange != undefined) {
                    // Get text at that range
                    const word = _document.getText(wordRange);
    
                    // Request hover information using the snooty-parser server
                    let request = async () => {
                        let contents: vscode.MarkdownString;
    
                        const file: string = await client.sendRequest("textDocument/resolve", {fileName: word, docPath: _document.uri.path, resolveType: "directive"});
                        const command = vscode.Uri.parse(`command:snooty.clickInclude`);
    
                        // Clean up absolute path for better UX. str.match() was not working with regex but can look into later
                        let workspaceFolder = vscode.workspace.name;
                        if (!workspaceFolder) {
                            return;
                        }
                        let folderIndex = file.search(workspaceFolder);
                        let hoverPathRelative = file.slice(folderIndex);
    
                        contents = new vscode.MarkdownString(`[${hoverPathRelative}](${command})`);
                        contents.isTrusted = true; // Enables commands to be used
    
                        return new vscode.Hover(contents, wordRange);
                    }
    
                    return request();
                }
              }
            } ()
        );
    
        vscode.languages.registerDocumentLinkProvider(
            documentSelector,
            new DocumentLinkProvider(client)
        );
    }
}
