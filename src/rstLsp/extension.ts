import { Python } from './../python';
import { Configuration } from './../features/utils/configuration';
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
import { ExtensionDownloader } from '../ExtensionDownloader';
import * as util from '../common';
import { StatusBarAlignment, window, workspace } from 'vscode';

export async function activate(context: vscode.ExtensionContext, logger: Logger, disabled: boolean, python: Python): Promise<void> {
    if (disabled) {
        return;
    }

    // Notify the user that if they change a snooty setting they need to restart
    // vscode.
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(() => {
        // TODO:
    }));

    var fs = require('fs');
    let serverModule: string = null;
    let args: string[] = [];
    if (!Configuration.getSnooty()) {
        logger.log('Use legacy language server.');
        logger.telemetry('legacy language server');

        const extensionId = 'lextudio.restructuredtext';
        const extension = vscode.extensions.getExtension(extensionId);
        await ensureRuntimeDependencies(extension, logger);

        // Defines the search path of your language server DLL. (.NET Core)
        const languageServerPaths = [
            "../restructuredtext-antlr/Server/bin/Debug/netcoreapp3.1/Server.dll",
            ".rst/Server.exe",
            ".rst/Server"
        ];
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
            let languageClient = new LanguageClient('restructuredtext', 'reStructuredText Language Server', serverOptions, clientOptions);

            // Push the disposable to the context's subscriptions so that the
            // client can be deactivated on extension deactivation
            context.subscriptions.push(languageClient.start());
            
            // Progress
            (() => {
                let config = workspace.getConfiguration('snooty');
                let statusStyle = config.get('misc.status', 'short');
                if (statusStyle == 'short' || statusStyle == 'detailed') {
                    let statusIcon = window.createStatusBarItem(StatusBarAlignment.Right);
                    statusIcon.text = 'rst-antlr: loading';
                    statusIcon.tooltip =
                        'rst-antlr is loading project metadata (ie, compile_commands.json)';
                    statusIcon.show();
                    languageClient.onReady().then(() => {
                        statusIcon.text = 'rst-antlr: idle';
                        // TODO:
                        // languageClient.onNotification('$snooty/progress', (args) => {

                        // });
                    });
                }
            })();
        }
        return;
    }

    serverModule = await Configuration.getPythonPath();

    let options: any = {};
    const sourceFolder = Configuration.getSnootySourceFolder();
    if (sourceFolder) {
        logger.telemetry('Snooty from source');
        // launch language server from source folder.
        options.cwd = sourceFolder;
        if (await python.checkPython(null, false) && await python.checkSnooty(null, false, false)) {
            vscode.window.showErrorMessage('Run `pip uninstall snooty-lextudio` and then restart VSCode to start debugging.');
            return;
        }
        if (!(await python.checkPython(null, false)) || !(await python.checkDebugPy(null, true))) {
            return;
        }
        args.push('-m', 'debugpy', '--listen', '5678');
        if (Configuration.getSnootyDebugLaunch()) {
            args.push('--wait-for-client');
        }
        vscode.window.showInformationMessage('debugpy is at port 5678. Connect and debug.');
    } else {
        if (!(await python.checkPython(null, false)) || !(await python.checkSnooty(null, true, true))) {
            return;
        }
    }

    logger.log('Use Snooty language server');
    logger.telemetry('Snooty language server');
    args.push('-m', 'snooty', 'language-server');
    if (serverModule != null) {

        // If the extension is launched in debug mode then the debug server options are used
        // Otherwise the run options are used
        let serverOptions: ServerOptions = {
            run: { command: serverModule, args: args, options: options },
            debug: { command: serverModule, args: args, options: options }
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

        (() => {
            let config = workspace.getConfiguration('snooty');
            let statusStyle = config.get('misc.status', 'short');
            if (statusStyle == 'short' || statusStyle == 'detailed') {
                let statusIcon = window.createStatusBarItem(StatusBarAlignment.Right);
                statusIcon.text = 'snooty: loading';
                statusIcon.tooltip =
                    'snooty is loading project metadata';
                statusIcon.show();
                client.onReady().then(() => {
                    statusIcon.text = 'snooty: idle';
                    // TODO:
                    // languageClient.onNotification('$snooty/progress', (args) => {

                    // });
                });
            }
        })();

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
