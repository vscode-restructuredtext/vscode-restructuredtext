'use strict';

import {
    workspace, window, ExtensionContext,
    TextDocumentContentProvider, EventEmitter,
    Event, Uri, TextDocument, OutputChannel
} from "vscode";
import { worker } from "cluster";

export class Configuration {
    public static loadSetting(
        configSection: string, defaultValue: string, header: string = "restructuredtext", expand: boolean = true
    ): string {
        var result = workspace.getConfiguration(header).get(configSection, defaultValue);
        if (expand && result != null) {
            return this.expandMacro(result);
        }

        return result;
    }

    public static setRoot() {
        var old = workspace.getConfiguration("restructuredtext").get<string>("confPath");
        if (old.indexOf("${workspaceRoot}") > -1)
        {
            workspace.getConfiguration("restructuredtext").update("confPath", this.expandMacro(old));
        }
    }

    private static expandMacro(input: string): string {
        let root = workspace.rootPath;
        return input.replace("${workspaceRoot}", root);
    }
}