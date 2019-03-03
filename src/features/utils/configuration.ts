'use strict';

import {
    Uri, workspace, WorkspaceFolder,
} from 'vscode';

export class Configuration {

    public static getConflictingExtensions(resource: Uri = null): string[] {
        return Configuration.loadAnySetting<string[]>('conflictingExtensions', null, resource);
    }

    public static getSphinxPath(resource: Uri = null): string {
        return Configuration.loadSetting('sphinxBuildPath', null, resource);
    }

    public static getConfPath(resource: Uri = null): string {
        return Configuration.loadSetting('confPath', null, resource);
    }

    public static getOutputFolder(resource: Uri = null): string {
        return Configuration.loadSetting('builtDocumentationPath', null, resource);
    }

    public static getLinterPath(resource: Uri = null): string {
        return Configuration.loadSetting('linter.executablePath', null, resource);
    }

    public static getExtraArgs(resource: Uri = null): string[] {
        return Configuration.loadAnySetting<string[]>('linter.extraArgs', null, resource);
    }

    public static getRunType(resource: Uri = null): string {
        return Configuration.loadAnySetting<string>('linter.run', 'onType', resource);
    }

    public static getPythonPath(resource: Uri = null): string {
        return Configuration.loadSetting('pythonPath', null, resource, 'python');
    }

    public static getLanguageServerDisabled(resource: Uri = null): boolean {
        return Configuration.loadAnySetting('languageServer.disabled', true, null);
    }

    public static getSupportedPlatforms(resource: Uri = null): string[] {
        return Configuration.loadAnySetting<string[]>("languageServer.supportedPlatforms", [], null);
    }

    public static getUpdateDelay(resource: Uri = null): number {
        return Configuration.loadAnySetting<number>("updateDelay", 300, resource);
    }

    public static async setConfPath(value: string, resource: Uri = null, insertMacro: boolean): Promise<string> {
        return await Configuration.saveSetting('confPath', value, resource, insertMacro);
    }

    public static async setRoot(resource: Uri = null) {
        const old = this.loadSetting('workspaceRoot', null, resource);
        if (old.indexOf('${workspaceRoot}') > -1) {
            await this.saveSetting('workspaceRoot', this.expandMacro(old, resource), resource);
        }
    }

    private static loadAnySetting<T>(
        configSection: string, defaultValue: T, resource: Uri, header: string = 'restructuredtext',
    ): T {
        return workspace.getConfiguration(header, resource).get(configSection, defaultValue);
    }

    private static async saveAnySetting<T>(
        configSection: string, value: T, resource: Uri, header: string = 'restructuredtext',
    ): Promise<T> {
        await workspace.getConfiguration(header, resource).update(configSection, value);
        return value;
    }

    private static loadSetting(
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

    private static async saveSetting(
        configSection: string, value: string, resource: Uri, insertMacro: boolean = false, header: string = 'restructuredtext',
    ): Promise<string> {
        if (insertMacro) {
            value = this.insertMacro(value, resource);
        }
        return await this.saveAnySetting<string>(configSection, value, resource, header);
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

    public static expandMacro(input: string, resource: Uri): string {
        if (resource == null || input.indexOf('${') === -1) {
            return input;
        }

        let expanded: string;
        if (input.indexOf('${env:') > -1) {
            expanded = input.replace(/\$\{env\:(.+)\}/, (match, p1)=>
                {
                    const variable = process.env[p1];
                    return variable == null ? '' : variable;
                });
        } else {
            expanded = input;
        }

        if (expanded.indexOf('${') > -1) {
            const path = this.GetRootPath(resource);
            if (path != null) {
                return expanded
                    .replace('${workspaceRoot}', path)
                    .replace('${workspaceFolder}', path);
            }
        }

        return expanded;
    }

    public static GetRootPath(resource: Uri): string {
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

            if (root != null) {
                path = root.uri.fsPath;
            }
        }

        return path;
    }
}
