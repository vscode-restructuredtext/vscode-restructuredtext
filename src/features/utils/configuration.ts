'use strict';

import {
    Uri, workspace, WorkspaceFolder,
} from 'vscode';

export class Configuration {
    public static loadAnySetting<T>(
        configSection: string, defaultValue: T, resource: Uri, header: string = 'restructuredtext',
    ): T {
        return workspace.getConfiguration(header, resource).get(configSection, defaultValue);
    }

    public static async saveAnySetting<T>(
        configSection: string, value: T, resource: Uri, header: string = 'restructuredtext',
    ): Promise<T> {
        await workspace.getConfiguration(header, resource).update(configSection, value);
        return value;
    }

    public static loadSetting(
        configSection: string,
        defaultValue: string,
        resource: Uri,
        header: string = 'restructuredtext',
        expand: boolean = true,
    ): string {
        const result = this.loadAnySetting<string>(configSection, defaultValue, resource, header);
        if (expand && result != null) {
            return this.expandMacro(result, resource);
        }

        return result;
    }

    public static async saveSetting(
        configSection: string, value: string, resource: Uri, insertMacro: boolean = false, header: string = 'restructuredtext',
    ): Promise<string> {
        if (insertMacro) {
            value = this.insertMacro(value, resource);
        }
        return await this.saveAnySetting<string>(configSection, value, resource, header);
    }

    public static async setRoot(resource: Uri = null) {
        const old = this.loadSetting('workspaceRoot', null, resource);
        if (old.indexOf('${workspaceRoot}') > -1) {
            await this.saveSetting('workspaceRoot', this.expandMacro(old, resource), resource);
        }
    }

    private static insertMacro(input: string, resource: Uri): string {
        if (resource == null) {
            return input;
        }

        let path: string;
        if (!workspace.workspaceFolders) {
            path = workspace.rootPath;
        } else {
            let root: WorkspaceFolder;
            if (workspace.workspaceFolders.length === 1) {
                root = workspace.workspaceFolders[0];
            } else {
                root = workspace.getWorkspaceFolder(resource);
            }

            path = root.uri.fsPath;
        }

        if (input.startsWith(path)) {
            return input
                .replace(path, '${workspaceFolder}');
        }
        return input;
    }

    private static expandMacro(input: string, resource: Uri): string {
        if (resource == null) {
            return input;
        }

        let path: string;
        if (!workspace.workspaceFolders) {
            path = workspace.rootPath;
        } else {
            let root: WorkspaceFolder;
            if (workspace.workspaceFolders.length === 1) {
                root = workspace.workspaceFolders[0];
            } else {
                root = workspace.getWorkspaceFolder(resource);
            }

            path = root.uri.fsPath;
        }

        return input
            .replace('${workspaceRoot}', path)
            .replace('${workspaceFolder}', path);
    }
}
