'use strict';

import {
    workspace, window, ExtensionContext,
    TextDocumentContentProvider, EventEmitter,
    Event, Uri, TextDocument, OutputChannel
} from "vscode";
import { worker } from "cluster";

export class Configuration {
    public static loadAnySetting<T>(
        configSection: string, defaultValue: T, header: string = "restructuredtext"
    ): T {
        return workspace.getConfiguration(header).get(configSection, defaultValue);
    }

    public static loadSetting(
        configSection: string, defaultValue: string, header: string = "restructuredtext", expand: boolean = true
    ): string {
        var result = this.loadAnySetting<string>(configSection, defaultValue, header);
        if (expand && result != null) {
            return this.expandMacro(result);
        }
        return result;
    }

    public static setRoot() {
        var old = workspace.getConfiguration("restructuredtext").get<string>("workspaceRoot");
        if (old.indexOf("${workspaceRoot}") > -1) {
            workspace.getConfiguration("restructuredtext").update("workspaceRoot", this.expandMacro(old));
        }
    }

    private static expandMacro(input: string): string {
        let root = workspace.rootPath;
        return input.replace("${workspaceRoot}", root);
    }
}