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
        this._timeout = Configuration.loadAnySetting("updateDelay", 300);

        // Get path to the source RST file
        let rstPath = uri.fsPath;
        if (rstPath.endsWith(".rendered"))
            rstPath = rstPath.substring(0, rstPath.lastIndexOf("."));
        this._channel.appendLine("Source file: " + rstPath);

        // Get the directory where the conf.py file is located
        this._input = this.findConfPyDir(rstPath);
        this._channel.appendLine("Sphinx conf.py directory: " + this._input);

        // The directory where Sphinx will write the html output
        let defaultOutput = path.join(this._input, "_build", "html");
        this._output = Configuration.loadSetting("builtDocumentationPath", defaultOutput);
        this._channel.appendLine("builtDocumentationPath: " + this._output);
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
        return this.preview(rstPath);
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

    private findConfPyDir(rstPath: string): string {
        // Sanity check - the file we are previewing must exist
        if (!fs.existsSync(rstPath) || !fs.statSync(rstPath).isFile) {
            return this.showError("Internal error: RST extension got invalid file name: " + rstPath);
        }

        // Check directory where RST file is located and parent directories for the conf.py file
        let walkDirs = Configuration.loadAnySetting("confInSameOrParentDir", true);
        this._channel.appendLine("confInSameOrParentDir: " + walkDirs);

        // Used if confInSameOrParentDir directory walking is disabled or fails
        this._channel.appendLine("${workspaceRoot}: " + workspace.rootPath);
        let confPathFromSettings = Configuration.loadSetting("confPath", workspace.rootPath);
        this._channel.appendLine("confPath: " + confPathFromSettings);

        // Directory walking turned off, just return the configured value
        if (!walkDirs)
            return confPathFromSettings;

        // Walk the directory up from the RST file directory looking for the conf.py file
        let dirName = rstPath;
        while (true) {
            // Get the name of the parent directory
            let parentDir = path.normalize(dirName + "/..");

            // Check if we are at the root directory already to avoid an infinte loop
            if (parentDir == dirName)
                break;

            // Sanity check - the parent directory must exist
            if (!fs.existsSync(parentDir) || !fs.statSync(parentDir).isDirectory)
                break;

            // Check this directory  for conf.py
            this._channel.appendLine("Looking for conf.py in: " + parentDir);
            let confPath = path.join(parentDir, "conf.py");
            if (fs.existsSync(confPath) && fs.statSync(confPath).isFile)
                return parentDir;

            dirName = parentDir;
        }

        // Fallback to the configured / default value
        return confPathFromSettings;
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

    private showHelp(error: string): string {
        let help = "<p>Cannot show preview page.</p>\
        <p>Diagnostics information has been written to OUTPUT | reStructuredText panel.</p>\
        <p>More information can be found in the troubleshooting guide at https://www.restructuredtext.net/en/latest/articles/troubleshooting.html .</p>";
        return help + "<p>" + error + "</p>";
    }

    private showError(errorMessage: string) {
        console.error(errorMessage);
        this._channel.appendLine("Error: " + errorMessage);
        return this.showHelp(errorMessage);
    }

    private relativeDocumentationPath(whole: string): string {
        return whole.substring(this._input.length);
    }

    private preview(rstPath: string): string | Thenable<string> {
        let confFile = path.join(this._input, "conf.py");
        var fs = require('fs');
        if (!fs.existsSync(confFile)) {
            return this.showError("Cannot find '" + confFile + "'. Please review the value of 'restructuredtext.confPath' in Workspace Settings.");
        }

        // Calculate full path to built html file.
        let whole = rstPath;
        let ext = whole.lastIndexOf(".");
        whole = whole.substring(0, ext) + ".html";

        let finalName = path.join(this._output, this.relativeDocumentationPath(whole));
        this._channel.appendLine("Compiler: " + this._cmd);
        this._channel.appendLine("HTML file: " + finalName);

        // Display file.
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
                    console.error(errorMessage);
                    this._channel.appendLine("Error: " + errorMessage);
                    resolve(this.showHelp(errorMessage));
                }

                if (process.platform === "win32" && stderr) {
                    var errText = stderr.toString();
                    if (errText.indexOf("Exception occurred:") > -1) {
                        let errorMessage = [
                            "Cannot run sphinx command '" + this._cmd + "' on Windows. Please review the value of 'restructuredtext.sphinxBuildPath' in Workspace Settings.",
                            errText
                        ].join("\n");
                        console.error(errorMessage);
                        this._channel.appendLine("Error: " + errorMessage);
                        resolve(this.showHelp(errorMessage));
                    }
                }

                fs.readFile(finalName, "utf8", (err, data) => {
                    if (err === null) {
                        let fixed = this.fixLinks(data, finalName);
                        resolve(fixed);
                    } else {
                        let errorMessage = [
                            "Cannot read page '" + finalName + "'.  Please review the value of 'restructuredtext.builtDocumentationPath' in Workspace Settings.",
                            err.name,
                            err.message,
                            err.stack
                        ].join("\n");
                        console.error(errorMessage);
                        this._channel.appendLine("Error: " + errorMessage);
                        resolve(this.showHelp(errorMessage));
                    }
                });
            });
        });
    }
}
