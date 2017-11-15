'use strict';

import {
    workspace, window, ExtensionContext,
    TextDocumentContentProvider, EventEmitter,
    Event, Uri, TextDocument, OutputChannel
} from "vscode";

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

    private static expandMacro(input: string): string {
        let root = workspace.rootPath;
        return input.replace("${workspaceRoot}", root);
    }
}