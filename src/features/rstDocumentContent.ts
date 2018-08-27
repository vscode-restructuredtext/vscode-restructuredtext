'use strict';

import {
    ExtensionContext, TextDocumentContentProvider, EventEmitter, Event,
    Uri, OutputChannel, window
} from "vscode";
import * as path from "path";
let fileUrl = require("file-url");
import { exec } from "child_process";
import * as fs from "fs";
import { Configuration } from "./utils/configuration";
import { RstTransformerSelector, RstTransformerConfig } from "./utils/confPyFinder";
import RstTransformerStatus from "./utils/statusBar";

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

    constructor(context: ExtensionContext, channel: OutputChannel,
        status: RstTransformerStatus) {
        this._context = context;
        this._waiting = false;
        this._channel = channel;
        this._rstTransformerStatus = status;
        context.subscriptions.push(this._channel);
    }

    public provideTextDocumentContent(uri: Uri): Promise<string> {
        this._timeout = Configuration.loadAnySetting("updateDelay", 300);

        // Get path to the source RST file
        let rstPath = uri.fsPath;
        if (rstPath.endsWith(".rendered"))
            rstPath = rstPath.substring(0, rstPath.lastIndexOf("."));
        this._channel.appendLine("Source file: " + rstPath);

        // Get the directory where the conf.py file is located
        return this.getRstTransformerConfig(rstPath).then(rstTransformerConf => {
            if (rstTransformerConf == null)
                return this.showError("You must select a RST -> HTML transformer from the menu that was shown", "");
            this._rstTransformerStatus.setConfiguration(rstTransformerConf.label);
            this._rstTransformerConfig = rstTransformerConf;
            Configuration.saveSetting("confPath", rstTransformerConf.confPyDirectory);
            this._input = rstTransformerConf.confPyDirectory;
            let htmlPath = "";
            let fixStyle = false; // force bg color to white and foreground to black
            let readStdout = false; // Get HTML from stdout

            // Configure Sphinx
            if (rstTransformerConf.confPyDirectory != "") {
                this._channel.appendLine("Sphinx conf.py directory: " + this._input);

                // The directory where Sphinx will write the html output
                let out = Configuration.loadSetting("builtDocumentationPath", null);
                if (out == null)
                    this._output = path.join(this._input, "_build", "html");
                else
                    this._output = out;
                this._channel.appendLine("Sphinx html directory: " + this._output);
                let quotedOutput = "\"" + this._output + "\"";

                var build = Configuration.loadSetting('sphinxBuildPath', null);
                if (build == null) {
                    var python = Configuration.loadSetting("pythonPath", null, "python");
                    if (python != null) {
                        build = python + " -m sphinx";
                    }
                }

                if (build == null) {
                    build = "sphinx-build";
                }

                // Configure the sphinx-build command
                this._options = { cwd: this._input };
                this._cmd = [
                    build,
                    "-b html",
                    ".",
                    quotedOutput
                ].join(" ");

                // Calculate full path to built html file.
                let whole = rstPath;
                let ext = whole.lastIndexOf(".");
                whole = whole.substring(0, ext) + ".html";
                htmlPath = path.join(this._output, this.relativeDocumentationPath(whole));

                // Make sure the conf.py file exists
                let confFile = path.join(this._input, "conf.py");
                var fs = require('fs');
                if (!fs.existsSync(confFile)) {
                    return this.showError(
                        "Cannot find 'conf.py'. Please review the value of 'restructuredtext.confPath' in Workspace Settings.",
                        "Current 'conf.py' setting is '" + confFile + "'."
                    );
                }
            }
            // Configure rst2html.py
            else {
                var build = Configuration.loadSetting('rst2htmlCommand', null);
                if (build == null) {
                    build = "rst2html.py";
                }

                // Configure the rst2html.py command
                this._cmd = [
                    build,
                    "'" + rstPath + "'",
                ].join(" ");
                fixStyle = true;
                readStdout = true;
                htmlPath = rstPath + ".html";
            }
            return this.preview(htmlPath, fixStyle, readStdout);
        });
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

    public showStatus(uri: Uri, status: RstTransformerStatus) {
        var setting = Configuration.loadSetting("confPath", null);
        if (setting != null)
        {
            this.getRstTransformerConfig(uri.path).then(rstTransformerConf => {
                status.setConfiguration(rstTransformerConf.label);
                status.update();
            });
        }
    }

    public resetRstTransformerConfig(uri: Uri) {
        this._rstTransformerConfig = null;
        Configuration.saveSetting("confPath", undefined);
        this.update(uri);
        if (window.activeTextEditor) {
            // we are relaxed and don't check for markdown files
            this.getRstTransformerConfig(window.activeTextEditor.document.uri.path).then(rstTransformerConf => {
                if (rstTransformerConf == null)
                    return this.showError("You must select a RST -> HTML transformer from the menu that was shown", "");
                this._rstTransformerStatus.setConfiguration(rstTransformerConf.label);
                this._rstTransformerConfig = rstTransformerConf;
                Configuration.saveSetting("confPath", rstTransformerConf.confPyDirectory);
            });
        }
    }

    private fixLinks(document: string, documentPath: string): string {
        return document.replace(
            new RegExp("((?:src|href)=[\'\"])(.*?)([\'\"])", "gmi"), (subString: string, p1: string, p2: string, p3: string): string => {
                return [
                    p1,
                    fileUrl(path.join(
                        path.dirname(documentPath),
                        p2
                    )),
                    p3
                ].join("");
            }
        );
    }

    private async getRstTransformerConfig(rstPath: string): Promise<RstTransformerConfig> {
        if (this._rstTransformerConfig)
            return Promise.resolve(this._rstTransformerConfig);
        else
            return RstTransformerSelector.findConfDir(rstPath, this._channel);
    }

    private showHelp(description: string, error: string): string {
        let help = "<body>\
          <section>\
            <article>\
              <header>\
                <h2>Cannot show preview page.</h2>\
                <h4>Description:</h4>\
                <p>" + description + "</p>\
                <h4>Detailed error message</h4>\
                <pre>" + error + "</pre>\
                <h4>More Information</h4>\
                <p>Diagnostics information has been written to OUTPUT | reStructuredText panel.</p>\
                <p>The troubleshooting guide can be found at</p>\
                <pre>https://www.restructuredtext.net/en/latest/articles/troubleshooting.html</pre>\
              </header>\
            </article>\
          </section>\
        </body>";
        return help;
    }

    private showError(description: string, errorMessage: string): string {
        console.error(description);
        console.error(errorMessage);
        this._channel.appendLine("Description: " + description);
        this._channel.appendLine("Error: " + errorMessage);
        return this.showHelp(description, errorMessage);
    }

    private relativeDocumentationPath(whole: string): string {
        return whole.substring(this._input.length);
    }

    private preview(htmlPath: string, fixStyle: boolean, readStdout: boolean):
        string | Thenable<string> {
        this._channel.appendLine("Compiler: " + this._cmd);
        this._channel.appendLine("HTML file: " + htmlPath);

        // Build and display file.
        return new Promise<string>((resolve, reject) => {
            exec(this._cmd, this._options, (error, stdout, stderr) => {
                if (error) {
                    let description = "Cannot run sphinx command. Please review the value of 'restructuredtext.sphinxBuildPath' in Workspace Settings."
                    let errorMessage = [
                        error.name,
                        error.message,
                        error.stack,
                        "",
                        stderr.toString()
                    ].join("\n");
                    resolve(this.showError(description, errorMessage));
                }

                if (process.platform === "win32" && stderr) {
                    var errText = stderr.toString();
                    if (errText.indexOf("Exception occurred:") > -1) {
                        let description =
                            "Cannot run sphinx command on Windows. Please review the value of 'restructuredtext.sphinxBuildPath' in Workspace Settings.";
                        resolve(this.showError(description, errText));
                    }
                }

                if (readStdout) {
                    resolve(this.prepareHtml(stdout, htmlPath, fixStyle));
                }
                else {
                    fs.readFile(htmlPath, "utf8", (err, data) => {
                        if (err === null) {
                            resolve(this.prepareHtml(data, htmlPath, fixStyle));
                        } else {
                            let description =
                                "Cannot read page '" + htmlPath + "'.  Please review the value of 'restructuredtext.builtDocumentationPath' in Workspace Settings.";
                            let errorMessage = [
                                err.name,
                                err.message,
                                err.stack
                            ].join("\n");
                            resolve(this.showError(description, errorMessage));
                        }
                    });
                }
            });
        });
    }

    private prepareHtml(html: string, htmlPath: string, fixStyle: boolean): string {
        let fixed = this.fixLinks(html, htmlPath);
        if (fixStyle)
            fixed += "<style>html, body {background: #fff;color: #000;}</style>";
        return fixed;
    }
}
