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
<<<<<<< HEAD
const Mustache = require('mustache');
=======
>>>>>>> 9105a499c79fbb8a32b62d5f713498bd58b4783e

export default class RstDocumentContentProvider implements TextDocumentContentProvider {
    private _context: ExtensionContext;
    private _onDidChange = new EventEmitter<Uri>();
    private _waiting: boolean;
<<<<<<< HEAD
    private _autoIndex: boolean;
    private _input: string;
    private _conf: string;
=======
    private _input: string;
>>>>>>> 9105a499c79fbb8a32b62d5f713498bd58b4783e
    private _output: string;
    private _cmd: string;
    private _options: any;
    private _channel: OutputChannel;

    constructor(context: ExtensionContext) {
        this._context = context;
        this._waiting = false;
<<<<<<< HEAD
        this._autoIndex = false;
=======
>>>>>>> 9105a499c79fbb8a32b62d5f713498bd58b4783e
        this._channel = window.createOutputChannel("reStructuredText");
        context.subscriptions.push(this._channel);
    }

    public provideTextDocumentContent(uri: Uri): string | Thenable<string> {
        let root = workspace.rootPath;
<<<<<<< HEAD
        this._autoIndex = RstDocumentContentProvider.loadSetting("autoIndex", 'false') === 'true';
        this._input = RstDocumentContentProvider.loadSetting("sourceDocumentationPath", root);
        this._conf = RstDocumentContentProvider.loadSetting("confPath", root);
        this._output = RstDocumentContentProvider.loadSetting("builtDocumentationPath", path.join(root, "_build", "html"));
        let quotedOutput = "\"" + this._output + "\"";
        let quotedInput = "\"" + this._input + "\"";
        let quotedConf = "\"" + this._conf + "\"";
=======
        this._input = RstDocumentContentProvider.loadSetting("confPath", root);
        this._output = RstDocumentContentProvider.loadSetting("builtDocumentationPath", path.join(root, "_build", "html"));
        let quotedOutput = "\"" + this._output + "\"";
>>>>>>> 9105a499c79fbb8a32b62d5f713498bd58b4783e

        var python = RstDocumentContentProvider.loadSetting("pythonPath", null, "python");
        var build: string;
        if (python == null) {
            build = RstDocumentContentProvider.loadSetting('sphinxBuildPath', null);
        }
        else {
            build = python + " -m sphinx";
        }

        if (build == null) {
            build = "sphinx-build";
        }

        this._options = { cwd: this._input };
        this._cmd = [
            build,
<<<<<<< HEAD
            "-c",
            quotedConf,
            "-b html",
            quotedInput,
            quotedOutput
        ].join(" ");


        //return this.preview(uri);
        return this.auto_preview(uri);
=======
            "-b html",
            ".",
            quotedOutput
        ].join(" ");
        return this.preview(uri);
>>>>>>> 9105a499c79fbb8a32b62d5f713498bd58b4783e
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
            }, 300);
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

    public static loadSetting(
        configSection: string, defaultValue: string, header: string = "restructuredtext", expand: boolean = true
    ): string {
        var result = workspace.getConfiguration(header).get(configSection, defaultValue);
        if (expand && result != null) {
            return RstDocumentContentProvider.expandMacro(result);
        }

        return result;
    }

    private static expandMacro(input: string): string {
        let root = workspace.rootPath;
        return input.replace("${workspaceRoot}", root);
    }

    private relativeDocumentationPath(whole: string): string {
        return whole.substring(this._input.length);
    }

<<<<<<< HEAD
    private auto_preview(uri): Thenable<string> {
        if (this._autoIndex) {
            return new Promise<string>((resolve, reject) => {
                this.generateIndex().then(
                    ()=> {
                        this.generateSphinxConf().then(
                            ()=> {
                                this.preview(uri).then(res => {
                                    resolve(res);
                                });
                            }, 
                            (err)=>{ 
                                console.info(err);
                                reject(err); 
                            }
                        );
                    },
                    (err)=> {
                        console.info(err);
                        reject(err);
                    });
                    return;
            });
        } else {
            return this.preview(uri);
        }

    }

    private generateIndex(): Thenable<void> {
        return new Promise<void>((resolve, reject) => {
            if (this._autoIndex === true && this._input != null && fs.existsSync(this._input)) {
                var indexRst = path.join(this._input, 'index.rst');
                var indexRstTemplate = path.join(this._context.extensionPath, '/templates/index.rst.tpl');
                console.info('template: ' + indexRstTemplate);
                console.info('generating: ' + indexRst);

                if (fs.existsSync(indexRst)) {
                    console.info('remove existing index.rst');
                    fs.unlinkSync(indexRst);
                }

                var files = [];
                this.listAllRSTs().then(rstFiles => {
                    console.log('rst files: ' + JSON.stringify(rstFiles));
                    var rendered = Mustache.render(fs.readFileSync(indexRstTemplate).toString(), { title: 'Preview doc', files: rstFiles });
                    console.log('rendered content: ' + rendered);
                    fs.writeFile(indexRst, rendered, (err) => {
                        if (err) {
                            console.info(err);
                            reject(err);
                        } else {
                            console.info('rst index generated:' + indexRst);
                            resolve();
                        }
                    });
                },
                    err => {
                        reject('failed to find rst files!');
                    });
            } else {
                console.info('skip rst index generation.');
                resolve();
            }
            return;
        });
    }

    private listAllRSTs(): Thenable<Array<string>> {

        return new Promise<Array<string>>((resolve, reject) => {
            var rstFiles = [];
            console.log('scanning rst files from the folder ' + this._input);
            fs.readdir(this._input, (err, files) => {
                for (var index in files) {
                    var file = files[index];
                    var ext = path.extname(file);
                    if (ext.toLowerCase() == '.rst' && !file.startsWith('index')) {
                        console.info('rst: ' + file);
                        rstFiles.push({ file: path.basename(file).replace(ext,'') });
                    }
                }
                if (!err) {
                    resolve(rstFiles);
                }
                else {
                    console.log(err);
                    reject(err);
                }
                return;
            });
        });
    }

    private generateSphinxConf(): Thenable<void> {

        return new Promise<void>(
            (resolve, reject) => {
                var confPy = path.join(this._conf, 'conf.py');
                if (this._conf != null && !fs.existsSync(confPy)) {
                    var confPyTemplate = path.join(this._context.extensionPath, '/templates/conf.py.tpl');
                    console.info('template: ' + confPyTemplate);
                    console.info('generating: ' + confPy);
                    var rendered = Mustache.render(fs.readFileSync(confPyTemplate).toString(), {});
                    fs.writeFile(confPy, rendered, (err) => {
                        if (err) {
                            console.info(err);
                            reject(err);
                        } else {
                            console.info('conf.py generated:' + confPy);
                            resolve();
                        }
                    });
                } else {
                    resolve();
                }

                return;
            }
        );

    }

=======
>>>>>>> 9105a499c79fbb8a32b62d5f713498bd58b4783e
    private preview(uri: Uri): Thenable<string> {
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
                    reject(errorMessage);
                    return;
                }

                if (process.platform === "win32" && stderr) {
                    let errorMessage = stderr.toString();
                    if (errorMessage.indexOf("Exception occurred:") > -1) {
                        console.error(errorMessage);
                        this._channel.appendLine("Error: " + errorMessage);
                        reject(errorMessage);
                        return;
                    }
                }

                fs.stat(finalName, (error, stat) => {
                    if (error !== null) {
                        let errorMessage = [
                            error.name,
                            error.message,
                            error.stack
                        ].join("\n");
                        console.error(errorMessage);
                        this._channel.appendLine("Error: " + errorMessage);
                        reject(errorMessage);
                        return;
                        //} else if(err.code === 'ENOENT') {
                        //    fs.writeFile('log.txt', 'Some log\n');
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
                            reject(errorMessage);
                        }
                    });
                });
            });
        });
    }
}
