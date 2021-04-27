'use strict';

<<<<<<< HEAD
import {
    Uri, workspace, WorkspaceFolder,
} from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
=======
import * as fs from 'fs';
import * as path from 'path';
import {
    extensions, Uri, workspace, WorkspaceConfiguration, WorkspaceFolder
} from 'vscode';
import { getConfig } from '../../config';
import { Constants } from './constants';
>>>>>>> upstream/master

export class Configuration {

    public static getConflictingExtensions(resource: Uri = null): string[] {
        return Configuration.loadAnySetting<string[]>('conflictingExtensions', null, resource);
    }

    public static getDocutilsWriter(resource: Uri = null): string {
        return Configuration.loadSetting('docutilsWriter', 'html', resource);
    }

<<<<<<< HEAD
=======
    public static getDocutilsWriterPart(resource: Uri = null): string {
        return Configuration.loadSetting('docutilsWriterPart', 'html_body', resource);
    }

>>>>>>> upstream/master
    public static getSphinxPath(resource: Uri = null): string {
        return Configuration.loadSetting('sphinxBuildPath', null, resource);
    }

    public static getConfPath(resource: Uri = null): string {
        return Configuration.loadSetting('confPath', null, resource);
    }

    public static getOutputFolder(resource: Uri = null): string {
        return Configuration.loadSetting('builtDocumentationPath', null, resource);
    }

<<<<<<< HEAD
    public static getLinterName(resource: Uri = null): string {
        return Configuration.loadSetting("linter.name", "rstcheck", resource);
=======
    public static getPreviewName(resource: Uri = null): string {
        return Configuration.loadSetting('preview.name', 'sphinx', resource);
    }

    public static getLinterName(resource: Uri = null): string {
        return Configuration.loadSetting('linter.name', 'rstcheck', resource);
>>>>>>> upstream/master
    }

    public static getLinterPath(resource: Uri = null): string {
        return Configuration.loadSetting('linter.executablePath', null, resource);
    }
<<<<<<< HEAD
=======

    public static getSnootySourceFolder(resource: Uri = null): string {
        return this.getConfiguration('snooty', resource).get<string>('sourceFolder');
    }

    public static getSnootyDebugLaunch(resource: Uri = null): boolean {
        return this.getConfiguration('snooty', resource).get<boolean>('debugLaunch', false);
    }

    public static getTelemetryDisabled(resource: Uri = null): boolean {
        return Configuration.loadAnySetting('telemetry.disabled', false, resource);
    }
>>>>>>> upstream/master
    
    public static getExtraArgs(resource: Uri = null): string[] {
        return Configuration.loadAnySetting<string[]>('linter.extraArgs', null, resource);
    }

    public static getRunType(resource: Uri = null): string {
<<<<<<< HEAD
        return Configuration.loadAnySetting<string>('linter.run', 'onType', resource);
    }

    public static getPythonPath(resource: Uri = null): string {
        const primary = Configuration.loadSetting('pythonPath', null, resource, 'python');
        // assume pythonPath is relative to workspace root.
=======
        return Configuration.loadAnySetting('linter.run', 'onType', resource);
    }

    public static async getPythonPath(resource: Uri = null): Promise<string> {
        try {
            const extension = extensions.getExtension('ms-python.python');
            if (!extension) {
                return Constants.python;
            }
            const usingNewInterpreterStorage = extension.packageJSON?.featureFlags?.usingNewInterpreterStorage;
            if (usingNewInterpreterStorage) {
                if (!extension.isActive) {
                    await extension.activate();
                }
                const pythonPath = extension.exports.settings.getExecutionDetails(resource).execCommand[0];
                return pythonPath;
            } else {
                return this.getConfiguration('python', resource).get<string>('pythonPath');
            }
        } catch (error) {
            return Constants.python;
        }
    }

    public static getConfiguration(section?: string, resource: Uri = null ): WorkspaceConfiguration {
        if (resource) {
            return workspace.getConfiguration(section, resource);
        } else {
            return workspace.getConfiguration(section);
        }
    }

    public static getPythonPath2(resource: Uri = null): string {
        // IMPORTANT: python3 does not work, so the default comes from Python extension.
        const primary = Configuration.loadSetting('pythonPath', 'python3', resource, true, 'python');
        // the user setting python.defaultInterpreterPath must be used to invoke the interpreter from the
        // VSCode internal storage
>>>>>>> upstream/master
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

<<<<<<< HEAD
    public static getSupportedPlatforms(resource: Uri = null): string[] {
        return Configuration.loadAnySetting<string[]>("languageServer.supportedPlatforms", [], null);
    }

    public static getUpdateDelay(resource: Uri = null): number {
        return Configuration.loadAnySetting<number>("updateDelay", 3000, resource);
=======
    public static getUpdateDelay(resource: Uri = null): number {
        return Configuration.loadAnySetting<number>('updateDelay', 3000, resource);
    }

    public static getListEditingDisabled(resource: Uri = null): boolean {
        return Configuration.loadAnySetting('editor.listEditing.disabled', false, null);
>>>>>>> upstream/master
    }

    public static async setConfPath(value: string, resource: Uri = null, insertMacro: boolean): Promise<string> {
        return await Configuration.saveSetting('confPath', value, resource, insertMacro);
    }

<<<<<<< HEAD
=======
    public static async setLanguageServerDisabled(resource: Uri = null) {
        await Configuration.saveAnySetting('languageServer.disabled', true, resource);
    }

>>>>>>> upstream/master
    public static async setLinterDisabled(resource: Uri = null) {
        await Configuration.saveAnySetting('linter.disabled', true, resource);
    }

    public static async setSphinxDisabled(resource: Uri = null) {
        await Configuration.saveAnySetting('preview.sphinx.disabled', true, resource);
    }

    public static async setDocUtilDisabled(resource: Uri = null) {
        await Configuration.saveAnySetting('preview.docutil.disabled', true, resource);
    }

<<<<<<< HEAD
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
=======
    private static loadAnySetting<T>(
        configSection: string, defaultValue: T, resource: Uri, header: string = 'restructuredtext',
    ): T {
        // return workspace.getConfiguration(header, resource).get(configSection, defaultValue);
        return getConfig(header, resource).get(configSection, defaultValue);
>>>>>>> upstream/master
    }

    private static async saveAnySetting<T>(
        configSection: string, value: T, resource: Uri, header: string = 'restructuredtext',
    ): Promise<T> {
<<<<<<< HEAD
        await workspace.getConfiguration(header, resource).update(configSection, value);
=======
        await getConfig(header, resource).update(configSection, value);
>>>>>>> upstream/master
        return value;
    }

    private static loadSetting(
        configSection: string,
        defaultValue: string,
        resource: Uri,
<<<<<<< HEAD
        header: string = 'restructuredtext',
        expand: boolean = true,
=======
        expand: boolean = true,
        header: string = 'restructuredtext'
>>>>>>> upstream/master
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
<<<<<<< HEAD
        if (resource == null || input.indexOf('${') === -1) {
=======
        if (input.indexOf('${') === -1) {
>>>>>>> upstream/master
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
<<<<<<< HEAD
=======
            if (resource == null) {
                return undefined;
            }
>>>>>>> upstream/master
            root = workspace.getWorkspaceFolder(resource);
        }

        if (root) {
            return root.uri.fsPath;
        }
        return undefined;
    }
}
