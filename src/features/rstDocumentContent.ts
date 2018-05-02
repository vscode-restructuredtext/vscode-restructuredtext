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

    constructor(context: ExtensionContext, channel: OutputChannel) {
        this._context = context;
        this._waiting = false;
        this._channel = channel;
        context.subscriptions.push(this._channel);
    }

    public provideTextDocumentContent(uri: Uri): string | Thenable<string> {
        let root = workspace.rootPath;
        this._channel.appendLine("${workspaceRoot}: " + root);
        this._timeout = Configuration.loadAnySetting("updateDelay", 300);
        this._input = Configuration.loadSetting("confPath", root);
        this._channel.appendLine("confPath: " + this._input);
        this._output = Configuration.loadSetting("builtDocumentationPath", path.join(root, "_build", "html"));
        this._channel.appendLine("builtDocumentationPath: " + this._output);
        let quotedOutput = "\"" + this._output + "\"";
        
        var build = Configuration.loadSetting('sphinxBuildPath', null);
        if (build == null) {
            var python = Configuration.loadSetting("pythonPath", null, "python");
            if (python != null)
            {
                build = python + " -m sphinx";
            }
        }

        if (build == null) {
            build = "sphinx-build";
        }

        this._options = { cwd: this._input };
        this._cmd = [
            build,
            "-b html",
            ".",
            quotedOutput
        ].join(" ");
        return this.preview(uri);
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

    private errorSnippet(error: string): string {
        return `
                <body>
                    ${error}
                </body>`;
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

    private relativeDocumentationPath(whole: string): string {
        return whole.substring(this._input.length);
    }

    private preview(uri: Uri): string | Thenable<string> {
        let help = "Cannot show preview page. Please check OUTPUT | reStructuredText for more information and visit the troubleshooting guide at https://www.restructuredtext.net/en/latest/articles/troubleshooting.html .";
        let confFile = path.join(this._input, "conf.py");
        var fs = require('fs');
        if (!fs.existsSync(path)) {
            let errorMessage = "Cannot find " + confFile + ". Please review the value of 'restructuredtext.confPath'.";
            console.error(errorMessage);
            this._channel.appendLine("Error: " + errorMessage);
            return help;
        }

        // Calculate full path to built html file.
        let whole = uri.fsPath;
        if (whole.endsWith(".rendered"))
            whole = whole.substring(0, whole.lastIndexOf("."));
        let ext = whole.lastIndexOf(".");
        whole = whole.substring(0, ext) + ".html";

        let finalName = path.join(this._output, this.relativeDocumentationPath(whole));

        this._channel.appendLine("Source file: " + uri.fsPath);
        this._channel.appendLine("Compiler: " + this._cmd);
        this._channel.appendLine("HTML file: " + finalName);

        // Display file.
        return new Promise<string>((resolve, reject) => {
            exec(this._cmd, this._options, (error, stdout, stderr) => {
                if (error) {
                    let errorMessage = [
                        error.name,
                        error.message,
                        error.stack,
                        "",
                        stderr.toString()
                    ].join("\n");
                    console.error(errorMessage);
                    this._channel.appendLine("Error: " + errorMessage);
                    resolve(help);
                }

                if (process.platform === "win32" && stderr) {
                    let errorMessage = stderr.toString();
                    if (errorMessage.indexOf("Exception occurred:") > -1) {
                        console.error(errorMessage);
                        this._channel.appendLine("Error: " + errorMessage);
                        resolve(help);
                    }
                }

                fs.readFile(finalName, "utf8", (err, data) => {
                    if (err === null) {
                        let fixed = this.fixLinks(data, finalName);
                        resolve(fixed);
                    } else {
                        let errorMessage = [
                            err.name,
                            err.message,
                            err.stack
                        ].join("\n");
                        console.error(errorMessage);
                        this._channel.appendLine("Error: " + errorMessage);
                        resolve(help);
                    }
                });
            });
        });
    }
}
