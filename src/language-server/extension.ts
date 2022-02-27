/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions } from 'vscode-languageclient';
import { Logger } from '../util/logger';
import { Configuration } from '../util/configuration';
import { Python } from '../util/python';
import { DocumentLinkProvider } from './docLinkProvider';
import open = require('open');
import mime = require('mime');
import { StatusBarAlignment, window, workspace } from 'vscode';
import path = require('path');

/**
 * Represents the current sphinx configuration / configuration options
 * that should be passed to sphinx on creation.
 */
 export interface SphinxConfig {

    /**
     * Sphinx's version number.
     */
    version?: string
  
    /**
     * The directory containing the project's 'conf.py' file.
     */
    confDir?: string
  
    /**
     * The source dir containing the *.rst files for the project.
     */
    srcDir?: string
  
    /**
     * The directory where Sphinx's build output should be stored.
     */
    buildDir?: string
  
    /**
     * The name of the builder to use.
     */
    builderName?: string
  
  }
  
  /**
   * Represents configuration options that should be passed to the server.
   */
  export interface ServerConfig {
  
    /**
     * Used to set the logging level of the server.
     */
    logLevel: string
  
    /**
     * A list of logger names to suppress output from.
     */
    logFilter?: string[]
  
    /**
     * A flag to indicate if Sphinx build output should be omitted from the log.
     */
    hideSphinxOutput: boolean
  }

/**
 * The initialization options we pass to the server on startup.
 */
 export interface InitOptions {

    /**
     * Language server specific options
     */
    server: ServerConfig
  
    /**
     * Sphinx specific options
     */
    sphinx: SphinxConfig
  }

  /**
   * Returns the LanguageClient options that are common to both modes of
   * transport.
   */
   function getLanguageClientOptions(config: vscode.WorkspaceConfiguration): LanguageClientOptions {

    let buildDir = Configuration.getOutputFolder();
    if (!buildDir) {
      buildDir = path.join(Configuration.getConfPath(), '_build');
    }

    let srcDir = Configuration.getSourcePath() ?? Configuration.getConfPath();
    if (srcDir === '') {
      srcDir = null;
    }

    let initOptions: InitOptions = {
      sphinx: {
        srcDir,
        confDir: srcDir === null ? null : Configuration.getConfPath(),
        buildDir: srcDir === null ? null : buildDir
      },
      server: {
        logLevel: 'debug',
        logFilter: [],
        hideSphinxOutput: false
      }
    }

    let documentSelector = [
      { scheme: 'file', language: 'restructuredtext' },
    ]

    if (true) {
      documentSelector.push(
        { scheme: 'file', language: 'python' }
      )
    }

    let clientOptions: LanguageClientOptions = {
      documentSelector: documentSelector,
      initializationOptions: initOptions,
      //outputChannel: this.channel
    }
    //this.logger.debug(`LanguageClientOptions: ${JSON.stringify(clientOptions)}`)
    return clientOptions
  }

export async function activate(context: vscode.ExtensionContext, logger: Logger, disabled: boolean, python: Python): Promise<void> {
    if (disabled) {
        return;
    }

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

        // If the extension is launched in debug mode then the debug server options are used
        // Otherwise the run options are used
        let serverOptions: ServerOptions = {
            run: { command: serverModule, args: args, options: options },
            debug: { command: serverModule, args: args, options: options }
        }

        const documentSelector = [
            { language: 'restructuredtext', scheme: 'file' },
        ];

        const client = new LanguageClient('Esbonio Language Client', serverOptions, getLanguageClientOptions(null));
        const restartServer = vscode.commands.registerCommand('esbonio.restart', async () => {
            vscode.commands.executeCommand('workbench.action.reloadWindow');
        });

        (() => {
            let config = workspace.getConfiguration('esbonio');
            let statusStyle = config.get('misc.status', 'short');
            if (statusStyle === 'short' || statusStyle === 'detailed') {
                let statusIcon = window.createStatusBarItem(StatusBarAlignment.Right);
                statusIcon.command = 'esbonio.restart';
                statusIcon.text = 'esbonio: loading';
                statusIcon.tooltip =
                    'Click to reload window and restart Esbonio language server';
                statusIcon.show();
                client.onReady().then(() => {
                    statusIcon.text = 'esbonio: idle';
                    vscode.languages.registerDocumentLinkProvider(
                        documentSelector,
                        new DocumentLinkProvider(client)
                    );
                });
            }
        })();

        // Push the disposable to the context's subscriptions so that the
        // client can be deactivated on extension deactivation
        context.subscriptions.push(client.start());
        context.subscriptions.push(restartServer);

        // Register custom command to allow includes, literalincludes, and figures to be clickable
        let hoverFile: string;
        const clickInclude: vscode.Disposable = vscode.commands.registerCommand('esbonio.clickInclude', async () => {
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
    }
}
