'use strict';

import * as fs from 'fs';
import * as path from 'path';
import {
    extensions, Uri, workspace, WorkspaceConfiguration, WorkspaceFolder
} from 'vscode';
import { getConfig } from './config';
import { Constants } from './constants';

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

    public static getConfPath(resource: Uri = null): string {
        return Configuration.loadSetting('sphinx.confDir', '', resource, true, 'esbonio');
    }

    public static getOutputFolder(resource: Uri = null): string {
        return Configuration.loadSetting('sphinx.buildDir', null, resource, true, 'esbonio');
    }

    public static getSourcePath(resource: Uri = null): string {
        return Configuration.loadSetting('sphinx.srcDir', null, resource, true, 'esbonio');
    }

    public static getPreviewName(resource: Uri = null): string {
        return Configuration.loadSetting('preview.name', 'sphinx', resource);
    }

    public static getDoc8Path(resource: Uri = null): string {
        return Configuration.loadSetting('linter.doc8.executablePath', null, resource);
    }

    public static getDoc8ExtraArgs(resource: Uri = null): string[] {
        return Configuration.loadAnySetting<string[]>('linter.doc8.extraArgs', null, resource);
    }

    public static getRstCheckPath(resource: Uri = null): string {
        return Configuration.loadSetting('linter.rstcheck.executablePath', null, resource);
    }

    public static getRstCheckExtraArgs(resource: Uri = null): string[] {
        return Configuration.loadAnySetting<string[]>('linter.rstcheck.extraArgs', null, resource);
    }

    public static getRstLintPath(resource: Uri = null): string {
        return Configuration.loadSetting('linter.rst-lint.executablePath', null, resource);
    }

    public static getRstLintExtraArgs(resource: Uri = null): string[] {
        return Configuration.loadAnySetting<string[]>('linter.rst-lint.extraArgs', null, resource);
    }

    public static getEsbonioSourceFolder(resource: Uri = null): string {
        return this.getConfiguration('esbonio', resource).get<string>('server.sourceFolder', null);
    }

    public static getEsbonioDebugLaunch(resource: Uri = null): boolean {
        return this.getConfiguration('esbonio', resource).get<boolean>('server.debugLaunch', false);
    }

    public static getTelemetryDisabled(resource: Uri = null): boolean {
        return Configuration.loadAnySetting('telemetry.disabled', false, resource);
    }
    
    public static getRunType(resource: Uri = null): string {
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

    public static getLinterDisabled(resource: Uri = null): string[] {
        return Configuration.loadAnySetting<string[]>('linter.disabledLinters', [], resource);
    }

    public static getSphinxDisabled(resource: Uri = null): boolean {
        return Configuration.loadAnySetting('preview.sphinx.disabled', false, resource);
    }

    public static getDocUtilDisabled(resource: Uri = null): boolean {
        return Configuration.loadAnySetting('preview.docutils.disabled', true, resource);
    }

    public static getLanguageServerDisabled(resource: Uri = null): boolean {
        return Configuration.loadAnySetting('languageServer.disabled', true, resource);
    }

    public static getSyntaxHighlightingDisabled(resource: Uri = null): boolean {
        return Configuration.loadAnySetting('syntaxHighlighting.disabled', false, resource);
    }

    public static getTableEditorDisabled(resource: Uri = null): boolean {
        return Configuration.loadAnySetting('editor.tableEditor.disabled', false, resource);
    }

    public static getTableEditorReformatDisabled(resource: Uri = null): boolean {
        return Configuration.loadAnySetting('editor.tableEditor.reformat.disabled', false, resource);
    }

    // list of underline characters, from higher level to lower level
    // Use the recommended items from http://docutils.sourceforge.net/docs/ref/rst/restructuredtext.html#sections,
    // The first six items are convention of Python documentation, https://devguide.python.org/documenting/#sections
    public static getAdornments(resource: Uri = null): string {
        return Configuration.loadAnySetting('editor.sectionEditor.adornments', "#*=-^\"'`:.~_+", resource);
    }

    public static getPythonRecommendationDisabled(resource: Uri = null): boolean {
        return Configuration.loadAnySetting('pythonRecommendation.disabled', false, resource);
    }

    public static async setPythonRecommendationDisabled(resource: Uri = null) {
        await Configuration.saveAnySetting('pythonRecommendation.disabled', true, resource);
    }

    public static async setConfPath(value: string, resource: Uri = null, insertMacro: boolean): Promise<string> {
        return await Configuration.saveSetting('sphinx.confDir', value, resource, insertMacro, 'esbonio');
    }

    public static async setPreviewName(value: string, resource: Uri = null): Promise<string> {
        return await Configuration.saveAnySetting('preview.name', value, resource);
    }    

    public static async setSphinxDisabled(resource: Uri = null) {
        await Configuration.saveAnySetting('preview.sphinx.disabled', true, resource);
    }

    public static async setDocUtilDisabled(resource: Uri = null) {
        await Configuration.saveAnySetting('preview.docutils.disabled', true, resource);
    }

    public static async setSyntaxHighlightingDisabled(resource: Uri = null) {
        await Configuration.saveAnySetting('syntaxHighlighting.disabled', true, resource);
    }

    private static loadAnySetting<T>(
        configSection: string, defaultValue: T, resource: Uri, header: string = 'restructuredtext',
    ): T {
        // return workspace.getConfiguration(header, resource).get(configSection, defaultValue);
        return getConfig(header, resource).get(configSection, defaultValue);
    }

    private static async saveAnySetting<T>(
        configSection: string, value: T, resource: Uri, header: string = 'restructuredtext',
    ): Promise<T> {
        if (workspace.workspaceFolders)
        {
            await getConfig(header, resource).update(configSection, value);
            return value;
        }
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
            expanded = input.replace(/\$\{env\:(.+)\}/, (_match, p1)=>
                {
                    const variable = process.env[p1];
                    return variable ?? '';
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
            return workspace.rootPath ?? path.dirname(resource.fsPath);
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
