'use strict';

import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import {
    Event, EventEmitter, ExtensionContext,
    OutputChannel, TextDocumentContentProvider, Uri, window,
} from 'vscode';
import { Configuration } from './utils/configuration';
import { RstTransformerConfig } from './utils/confPyFinder';
import { RstTransformerSelector } from './utils/selector';
import RstTransformerStatus from './utils/statusBar';

export default class RstDocumentContentProvider implements TextDocumentContentProvider {
    private _context: ExtensionContext;
    private _onDidChange = new EventEmitter<Uri>();
    private _waiting: boolean;
    private _input: string;
    private _output: string;
    private _cmd: string;
    private _options: any;
    private _channel: OutputChannel;
    private _timeout: number;
    private _rstTransformerConfig: RstTransformerConfig;
    private _rstTransformerStatus: RstTransformerStatus;

    constructor(context: ExtensionContext, channel: OutputChannel, status: RstTransformerStatus) {
        this._context = context;
        this._waiting = false;
        this._channel = channel;
        this._rstTransformerStatus = status;
        context.subscriptions.push(this._channel);
    }

    public async provideTextDocumentContent(resource: Uri): Promise<string> {
        const uri = this.getOriginalUri(resource);
        this._timeout = Configuration.loadAnySetting('updateDelay', 300, uri);

        // Get path to the source RST file
        const rstPath = uri.fsPath;
        this._channel.appendLine('Source file: ' + rstPath);

        // Get the directory where the conf.py file is located
        const rstTransformerConf = await this.refreshConfig(uri);
        if (rstTransformerConf == null) {
            this.showError('You must select a RST -> HTML transformer from the menu that was shown', '');
        }

        let htmlPath = '';
        let fixStyle = false; // force bg color to white and foreground to black
        let readStdout = false; // Get HTML from stdout

        // Configure Sphinx
        if (rstTransformerConf.confPyDirectory !== '') {
            this._input = rstTransformerConf.confPyDirectory;
            this._channel.appendLine('Sphinx conf.py directory: ' + this._input);

            // The directory where Sphinx will write the html output
            const out = Configuration.loadSetting('builtDocumentationPath', null, uri);
            if (out == null) {
                this._output = path.join(this._input, '_build', 'html');
            } else {
                this._output = out;
            }

            this._channel.appendLine('Sphinx html directory: ' + this._output);
            const quotedOutput = '"' + this._output + '"';

            let build = Configuration.loadSetting('sphinxBuildPath', null, uri);
            if (build == null) {
                const python = Configuration.loadSetting('pythonPath', null, uri, 'python');
                if (python != null) {
                    build = python + ' -m sphinx';
                }
            }

            if (build == null) {
                build = 'sphinx-build';
            }

            // Configure the sphinx-build command
            this._options = { cwd: this._input };
            this._cmd = [
                build,
                '-b html',
                '.',
                quotedOutput,
            ].join(' ');

            // Calculate full path to built html file.
            let whole = rstPath;
            const ext = whole.lastIndexOf('.');
            whole = whole.substring(0, ext) + '.html';
            htmlPath = path.join(this._output, this.relativeDocumentationPath(whole));

            // Make sure the conf.py file exists
            const confFile = path.join(this._input, 'conf.py');
            if (!fs.existsSync(confFile)) {
                return this.showError(
                    'Cannot find "conf.py". Please review "restructuredtext.confPath" setting.',
                    'Current "conf.py" setting is "' + confFile + '".',
                );
            }
        } else {
            // Configure rst2html.py
            let build = Configuration.loadSetting('rst2htmlCommand', null, uri);
            if (build == null) {
                build = 'rst2html.py';
            }

            // Configure the rst2html.py command
            this._cmd = [
                build,
                '"' + rstPath + '"',
            ].join(' ');
            fixStyle = true;
            readStdout = true;
            htmlPath = rstPath + '.html';
        }
        return this.preview(htmlPath, fixStyle, readStdout);
     }

    get onDidChange(): Event<Uri> {
        return this._onDidChange.event;
    }

    public update(uri: Uri) {
        if (!this._waiting) {
            this._waiting = true;
            setTimeout(() => {
                this._waiting = false;
                this._onDidChange.fire(uri);
            }, this._timeout);
        }
    }

    public async showStatus(uri: Uri, status: RstTransformerStatus) {
        const setting = Configuration.loadSetting('confPath', null, uri);
        if (setting == null) {
            return;
        }

        const rstTransformerConf = await this.getRstTransformerConfig(uri);
        status.setConfiguration(rstTransformerConf.label);
        status.update();
    }

    public async resetRstTransformerConfig(uri: Uri) {
        this._rstTransformerConfig = null;
        await Configuration.saveSetting('confPath', undefined, uri);
        this.update(uri);
        if (!window.activeTextEditor) {
            return;
        }

        // we are relaxed and don't check for markdown files
        await this.refreshConfig(window.activeTextEditor.document.uri);
    }

    private fixLinks(document: string, documentPath: string): string {
        return document.replace(
            new RegExp('((?:src|href)=[\'\"])(.*?)([\'\"])', 'gmi'),
            (subString: string, p1: string, p2: string, p3: string): string => {
                const fileUrl = require('file-url');
                return [
                    p1,
                    fileUrl(path.join(
                        path.dirname(documentPath),
                        p2,
                    )),
                    p3,
                ].join('');
            },
        );
    }

    private async getRstTransformerConfig(resource: Uri): Promise<RstTransformerConfig> {
        if (this._rstTransformerConfig) {
            return this._rstTransformerConfig;
        } else {
            return RstTransformerSelector.findConfDir(resource, this._channel);
        }
    }

    private showHelp(description: string, error: string): string {
        const help = '<body>\
          <section>\
            <article>\
              <header>\
                <h2>Cannot show preview page.</h2>\
                <h4>Description:</h4>\
                ' + description + '\
                <h4>Detailed error message</h4>\
                <pre>' + error + '</pre>\
                <h4>More Information</h4>\
                <p>Diagnostics information has been written to OUTPUT | reStructuredText panel.</p>\
                <p>The troubleshooting guide can be found at</p>\
                <pre>https://docs.restructuredtext.net/articles/troubleshooting.html</pre>\
              </header>\
            </article>\
          </section>\
        </body>';
        return help;
    }

    private showError(description: string, errorMessage: string): string {
        this._channel.appendLine('Description: ' + description);
        this._channel.appendLine('Error: ' + errorMessage);
        return this.showHelp(description, errorMessage);
    }

    private relativeDocumentationPath(whole: string): string {
        return whole.substring(this._input.length);
    }

    private preview(htmlPath: string, fixStyle: boolean, readStdout: boolean):
        Promise<string> {
        this._channel.appendLine('Compiler: ' + this._cmd);
        this._channel.appendLine('Working directory: ' + this._input);
        this._channel.appendLine('HTML file: ' + htmlPath);

        // Build and display file.
        return new Promise<string>((resolve, reject) => {
            exec(this._cmd, this._options, (error, stdout, stderr) => {
                if (error) {
                    const description =
                        '<p>Cannot generate preview page.</p>\
                        <p>Possible causes are,</p>\
                        <ul>\
                        <li>Python is not installed properly.</li>\
                        <li>Sphinx is not installed properly (if preview uses "conf.py").</li>\
                        <li>Wrong value is set on "restructuredtext.sphinxBuildPath".</li>\
                        <li>A wrong "conf.py" file is selected.</li>\
                        <li>DocUtil is not installed properly (if preview uses "rst2html.py").</li>\
                        </ul>';
                    const errorMessage = [
                        error.name,
                        error.message,
                        error.stack,
                        '',
                        stderr.toString(),
                    ].join('\n');
                    resolve(this.showError(description, errorMessage));
                }

                if (process.platform === 'win32' && stderr) {
                    const errText = stderr.toString();
                    if (errText.indexOf('Exception occurred:') > -1) {
                        const description =
                            '<p>Cannot generate preview page on Windows.</p>\
                            <p>Possible causes are,</p>\
                            <ul>\
                            <li>Python is not installed properly.</li>\
                            <li>Sphinx is not installed properly (if preview uses "conf.py").</li>\
                            <li>Wrong value is set on "restructuredtext.sphinxBuildPath".</li>\
                            <li>A wrong "conf.py" file is selected.</li>\
                            <li>DocUtil is not installed properly (if preview uses "rst2html.py").</li>\
                            </ul>';
                        resolve(this.showError(description, errText));
                    }
                }

                if (readStdout) {
                    resolve(this.prepareHtml(stdout, htmlPath, fixStyle));
                } else {
                    fs.readFile(htmlPath, 'utf8', (err, data) => {
                        if (err === null) {
                            resolve(this.prepareHtml(data, htmlPath, fixStyle));
                        } else {
                            const description =
                                '<p>Cannot read preview page "' + htmlPath + '".</p>\
                                <p>Possible causes are,</p>\
                                <ul>\
                                <li>A wrong "conf.py" file is selected.</li>\
                                <li>Wrong value is set on "restructuredtext.builtDocumentationPath".</li>\
                                </ul>';
                            const errorMessage = [
                                err.name,
                                err.message,
                                err.stack,
                            ].join('\n');
                            resolve(this.showError(description, errorMessage));
                        }
                    });
                }
            });
        });
    }

    private prepareHtml(html: string, htmlPath: string, fixStyle: boolean): string {
        let fixed = this.fixLinks(html, htmlPath);
        if (fixStyle) {
            fixed += '<style>html, body {background: #fff;color: #000;}</style>';
        }

        return fixed;
    }

    private async refreshConfig(resource: Uri): Promise<RstTransformerConfig> {
        const rstTransformerConf = await this.getRstTransformerConfig(resource);
        if (rstTransformerConf == null) {
            return null;
        }

        this._rstTransformerStatus.setConfiguration(rstTransformerConf.label);
        this._rstTransformerConfig = rstTransformerConf;
        if (!rstTransformerConf.confPyDirectoryFromSettings) {
            await Configuration.saveSetting('confPath', rstTransformerConf.confPyDirectory, resource);
        }
        return rstTransformerConf;
    }

    private getOriginalUri(uri: Uri): Uri {
        return uri.with({ scheme: 'file', path: uri.path, query: uri.toString() });
    }
}
