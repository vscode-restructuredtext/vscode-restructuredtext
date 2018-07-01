'use strict';

import {
    workspace, window, ExtensionContext,
    TextDocumentContentProvider, EventEmitter,
    Event, Uri, TextDocument, OutputChannel
} from "vscode";
import * as path from "path";
let fileUrl = require("file-url");
import { exec } from "child_process";
import * as fs from "fs";
import { Configuration } from "./utils/configuration";
import { RstTransformerSelector, RstTransformerConfig } from "./utils/confPyFinder";

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

    constructor(context: ExtensionContext, channel: OutputChannel) {
        this._context = context;
        this._waiting = false;
        this._channel = channel;
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
            this._rstTransformerConfig = rstTransformerConf;
            this._input = rstTransformerConf.confPyDirectory;
            let htmlPath = "";

            // Configure Sphinx
            if (rstTransformerConf.useSphinx) {
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
                    return this.showError("Cannot find '" + confFile + "'. Please review the value of 'restructuredtext.confPath' in Workspace Settings.");
                }
            }
            // Configure rst2html.py
            else {
                var build = Configuration.loadSetting('rst2htmlCommand', null);
                if (build == null) {
                    build = "rst2html.py";
                }

                let htmlBase = path.basename(rstPath) + "_rst2html_output.html";
                htmlPath = path.join(this._input, htmlBase);

                // Configure the rst2html.py command
                this._options = { cwd: this._input };
                this._cmd = [
                    build,
                    "'" + path.basename(rstPath) + "'",
                    "'" + htmlBase + "'"
                ].join(" ");
            }
            return this.preview(htmlPath);
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

    private async getRstTransformerConfig(rstPath): Promise<RstTransformerConfig> {
        if (this._rstTransformerConfig)
            return Promise.resolve(this._rstTransformerConfig);
        else
            return RstTransformerSelector.findConfDir(rstPath, this._channel);
    }

    private showHelp(error: string): string {
        let help = "<p>Cannot show preview page.</p>\
        <p>Diagnostics information has been written to OUTPUT | reStructuredText panel.</p>\
        <p>More information can be found in the troubleshooting guide at https://www.restructuredtext.net/en/latest/articles/troubleshooting.html .</p>";
        return help + "<p>" + error + "</p>";
    }

    private showError(errorMessage: string): string {
        console.error(errorMessage);
        this._channel.appendLine("Error: " + errorMessage);
        return this.showHelp(errorMessage);
    }

    private relativeDocumentationPath(whole: string): string {
        return whole.substring(this._input.length);
    }

    private preview(htmlPath: string): string | Thenable<string> {
        this._channel.appendLine("Compiler: " + this._cmd);
        this._channel.appendLine("HTML file: " + htmlPath);

        // Build and display file.
        return new Promise<string>((resolve, reject) => {
            exec(this._cmd, this._options, (error, stdout, stderr) => {
                if (error) {
                    let errorMessage = [
                        "Cannot run sphinx command '" + this._cmd + "'. Please review the value of 'restructuredtext.sphinxBuildPath' in Workspace Settings.",
                        error.name,
                        error.message,
                        error.stack,
                        "",
                        stderr.toString()
                    ].join("\n");
                    resolve(this.showError(errorMessage));
                }

                if (process.platform === "win32" && stderr) {
                    var errText = stderr.toString();
                    if (errText.indexOf("Exception occurred:") > -1) {
                        let errorMessage = [
                            "Cannot run sphinx command '" + this._cmd + "' on Windows. Please review the value of 'restructuredtext.sphinxBuildPath' in Workspace Settings.",
                            errText
                        ].join("\n");
                        resolve(this.showError(errorMessage));
                    }
                }

                fs.readFile(htmlPath, "utf8", (err, data) => {
                    if (err === null) {
                        let fixed = this.fixLinks(data, htmlPath);
                        resolve(fixed);
                    } else {
                        let errorMessage = [
                            "Cannot read page '" + htmlPath + "'.  Please review the value of 'restructuredtext.builtDocumentationPath' in Workspace Settings.",
                            err.name,
                            err.message,
                            err.stack
                        ].join("\n");
                        resolve(this.showError(errorMessage));
                    }
                });
            });
        });
    }
}
