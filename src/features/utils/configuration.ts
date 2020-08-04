'use strict';

import {
    Uri, workspace, WorkspaceFolder,
} from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class Configuration {

    public static getConflictingExtensions(resource: Uri = null): string[] {
        return Configuration.loadAnySetting<string[]>('conflictingExtensions', null, resource);
    }

    public static getDocutilsWriter(resource: Uri = null): string {
        return Configuration.loadSetting('docutilsWriter', 'html', resource);
    }

    public static getDocutilsWriterPart(resource: Uri = null): string {
        return Configuration.loadSetting('docutilsWriterPart', 'html_body', resource);
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

    public static getPreviewName(resource: Uri = null): string {
        return Configuration.loadSetting("preview.name", "sphinx", resource);
    }

    public static getLinterName(resource: Uri = null): string {
        return Configuration.loadSetting("linter.name", "rstcheck", resource);
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
        // IMPORTANT: python3 does not work, so the default comes from Python extension.
        const primary = Configuration.loadSetting('defaultInterpreterPath', 'python3', resource, true, 'python');
        // the user setting python.defaultInterpreterPath must be used to invoke the interpreter from the
        // VSCode internal storage
        if (primary) {
            const workspaceRoot = Configuration.GetRootPath(resource);
            if (workspaceRoot) {
                const optional = path.join(workspaceRoot, primary);
                if (fs.existsSync(optional)) {
                    return optional;
                }
            }
        }
        return primary;
    }

    public static getLinterDisabled(resource: Uri = null): boolean {
        return Configuration.loadAnySetting('linter.disabled', true, null);
    }

    public static getSphinxDisabled(resource: Uri = null): boolean {
        return Configuration.loadAnySetting('preview.sphinx.disabled', true, null);
    }

    public static getDocUtilDisabled(resource: Uri = null): boolean {
        return Configuration.loadAnySetting('preview.docutil.disabled', true, null);
    }

    public static getLanguageServerDisabled(resource: Uri = null): boolean {
        return Configuration.loadAnySetting('languageServer.disabled', true, null);
    }

    public static getSupportedPlatforms(resource: Uri = null): string[] {
        return Configuration.loadAnySetting<string[]>("languageServer.supportedPlatforms", [], null);
    }

    public static getUpdateDelay(resource: Uri = null): number {
        return Configuration.loadAnySetting<number>("updateDelay", 3000, resource);
    }

    public static async setConfPath(value: string, resource: Uri = null, insertMacro: boolean): Promise<string> {
        return await Configuration.saveSetting('confPath', value, resource, insertMacro);
    }

    public static async setLinterDisabled(resource: Uri = null) {
        await Configuration.saveAnySetting('linter.disabled', true, resource);
    }

    public static async setSphinxDisabled(resource: Uri = null) {
        await Configuration.saveAnySetting('preview.sphinx.disabled', true, resource);
    }

    public static async setDocUtilDisabled(resource: Uri = null) {
        await Configuration.saveAnySetting('preview.docutil.disabled', true, resource);
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
        expand: boolean = true,
        header: string = 'restructuredtext'
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
        if (input.indexOf('${') === -1) {
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
            if (path) {
                return expanded
                    .replace('${workspaceRoot}', path)
                    .replace('${workspaceFolder}', path);
            }
        }

        return expanded;
    }

    public static GetRootPath(resource: Uri): string {
        if (!workspace.workspaceFolders) {
            return workspace.rootPath;
        }

        let root: WorkspaceFolder;
        if (workspace.workspaceFolders.length === 1) {
            root = workspace.workspaceFolders[0];
        } else {
            if (resource == null) {
                return undefined;
            }
            root = workspace.getWorkspaceFolder(resource);
        }

        if (root) {
            return root.uri.fsPath;
        }
        return undefined;
    }
}
