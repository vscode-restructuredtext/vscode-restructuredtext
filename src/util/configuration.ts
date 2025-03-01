'use strict';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {injectable} from 'inversify';
import * as vscode from 'vscode';
import { path } from '../pathUtils';
// Import fs conditionally
let fs: any;
if (vscode.env.uiKind === vscode.UIKind.Desktop) {
    // Only import fs in desktop environment
    fs = require('fs');
}
import {
    Uri,
    workspace,
    WorkspaceConfiguration,
    WorkspaceFolder,
} from 'vscode';
import {getConfig} from './config';
import {Constants} from '../constants';

@injectable()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class Configuration {
    public getConflictingExtensions(resource?: Uri): string[] | undefined {
        return this.loadAnySetting<string[]>(
            'conflictingExtensions',
            undefined,
            resource
        );
    }

    public getRecommendedExtensions(resource?: Uri): string[] | undefined {
        return this.loadAnySetting<string[]>(
            'recommendedExtensions',
            undefined,
            resource
        );
    }

    public getDoc8Path(resource?: Uri): string | undefined {
        return this.loadSetting(
            'linter.doc8.executablePath',
            undefined,
            resource
        );
    }

    public getDoc8ExtraArgs(resource?: Uri): string[] | undefined {
        return this.loadAnySetting<string[]>(
            'linter.doc8.extraArgs',
            undefined,
            resource
        );
    }

    public getRstCheckPath(resource?: Uri): string | undefined {
        return this.loadSetting(
            'linter.rstcheck.executablePath',
            undefined,
            resource
        );
    }

    public getRstCheckExtraArgs(resource?: Uri): string[] | undefined {
        return this.loadAnySetting<string[]>(
            'linter.rstcheck.extraArgs',
            undefined,
            resource
        );
    }

    public getRstLintPath(resource?: Uri): string | undefined {
        return this.loadSetting(
            'linter.rst-lint.executablePath',
            undefined,
            resource
        );
    }

    public getRstLintExtraArgs(resource?: Uri): string[] | undefined {
        return this.loadAnySetting<string[]>(
            'linter.rst-lint.extraArgs',
            undefined,
            resource
        );
    }

    public getTelemetryDisabled(resource?: Uri): boolean | undefined {
        return this.loadAnySetting('telemetry.disabled', false, resource);
    }

    public getRunType(resource?: Uri): string | undefined {
        return this.loadAnySetting('linter.run', 'onType', resource);
    }

    public async getPythonPath(resource?: Uri): Promise<string> {
        try {
            const extension = extensions.getExtension('ms-python.python');
            if (!extension) {
                return Constants.python;
            }
            const usingNewInterpreterStorage =
                extension.packageJSON?.featureFlags?.usingNewInterpreterStorage;
            if (usingNewInterpreterStorage) {
                if (!extension.isActive) {
                    await extension.activate();
                }
                const pythonPath =
                    extension.exports.settings.getExecutionDetails(resource)
                        .execCommand[0];
                return pythonPath;
            } else {
                return (
                    this.getConfiguration('python', resource).get<string>(
                        'pythonPath'
                    ) ?? Constants.python
                );
            }
        } catch (error) {
            return Constants.python;
        }
    }

    public getConfiguration(
        section?: string,
        resource?: Uri
    ): WorkspaceConfiguration {
        if (resource) {
            return workspace.getConfiguration(section, resource);
        } else {
            return workspace.getConfiguration(section);
        }
    }

    public getPythonPath2(resource?: Uri): string | undefined {
        // IMPORTANT: python3 does not work, so the default comes from Python extension.
        const primary = this.loadSetting(
            'pythonPath',
            'python3',
            resource,
            true,
            'python'
        );
        // the user setting python.defaultInterpreterPath must be used to invoke the interpreter from the
        // VSCode internal storage
        if (primary) {
            const workspaceRoot = this.getRootPath(resource);
            if (workspaceRoot) {
                const optional = path.join(workspaceRoot, primary);
                if (fs.existsSync(optional)) {
                    return optional;
                }
            }
        }
        return primary;
    }

    public getLinterDisabled(resource?: Uri): string[] | undefined {
        return this.loadAnySetting<string[]>(
            'linter.disabledLinters',
            [],
            resource
        );
    }

    public getTableEditorDisabled(resource?: Uri): boolean | undefined {
        return this.loadAnySetting(
            'editor.tableEditor.disabled',
            false,
            resource
        );
    }

    public getTableEditorReformatDisabled(resource?: Uri): boolean | undefined {
        return this.loadAnySetting(
            'editor.tableEditor.reformat.disabled',
            false,
            resource
        );
    }

    // list of underline characters, from higher level to lower level
    // Use the recommended items from http://docutils.sourceforge.net/docs/ref/rst/restructuredtext.html#sections,
    // The first six items are convention of Python documentation, https://devguide.python.org/documenting/#sections
    public getAdornments(resource?: Uri): string | undefined {
        return this.loadAnySetting(
            'editor.sectionEditor.adornments',
            '#*=-^"\'`:.~_+',
            resource
        );
    }

    public getPythonRecommendationDisabled(
        resource?: Uri
    ): boolean | undefined {
        return this.loadAnySetting(
            'pythonRecommendation.disabled',
            false,
            resource
        );
    }

    public async setPythonRecommendationDisabled(resource?: Uri) {
        await this.saveAnySetting(
            'pythonRecommendation.disabled',
            true,
            resource
        );
    }

    // Example of a method that uses fs
    public readConfigFile(filePath: string): any {
        // Check if we're in a web environment
        if (vscode.env.uiKind === vscode.UIKind.Web) {
            // Return a default value or empty object for web
            console.log('File system operations not supported in web environment');
            return {};
        }
        
        try {
            // Only execute this code in desktop environment
            const content = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(content);
        } catch (err) {
            console.error(`Error reading config file: ${err}`);
            return {};
        }
    }

    // Example of a method that uses path
    public resolveConfigPath(relativePath: string): string {
        // Use the pathUtils instead of direct path dependency
        return path.resolve(relativePath);
    }

    // Example of feature detection for web environment
    public isFeatureSupported(feature: string): boolean {
        // Disable certain features in web environment
        if (vscode.env.uiKind === vscode.UIKind.Web) {
            const webUnsupportedFeatures = ['fileWatcher', 'externalProcess', 'localFileSystem'];
            if (webUnsupportedFeatures.includes(feature)) {
                return false;
            }
        }
        // ...existing feature detection logic...
        return true;
    }

    private loadAnySetting<T>(
        configSection: string,
        defaultValue?: T,
        resource?: Uri,
        header = 'restructuredtext'
    ): T | undefined {
        if (defaultValue) {
            return getConfig(header, resource).get(configSection, defaultValue);
        }
        return getConfig(header, resource).get<T>(configSection);
    }

    private async saveAnySetting<T>(
        configSection: string,
        value: T,
        resource?: Uri,
        header = 'restructuredtext'
    ): Promise<T | undefined> {
        if (workspace.workspaceFolders) {
            await getConfig(header, resource).update(configSection, value);
            return value;
        }
        return undefined;
    }

    private loadSetting(
        configSection: string,
        defaultValue?: string,
        resource?: Uri,
        expand = true,
        header = 'restructuredtext'
    ): string | undefined {
        const result = this.loadAnySetting<string>(
            configSection,
            defaultValue,
            resource,
            header
        );
        if (expand && result) {
            return this.expandMacro(result!, resource);
        }

        return result;
    }

    public expandMacro(input: string, resource?: Uri): string {
        if (input.indexOf('${') === -1) {
            return input;
        }

        let expanded: string;
        if (input.indexOf('${env:') > -1) {
            expanded = input.replace(/\$\{env:(.+)\}/, (_match, p1) => {
                const variable = process.env[p1];
                return variable ?? '';
            });
        } else {
            expanded = input;
        }

        if (expanded.indexOf('${') > -1) {
            const path = this.getRootPath(resource);
            if (path) {
                return expanded
                    .replace('${workspaceRoot}', path)
                    .replace('${workspaceFolder}', path);
            }
        }

        return expanded;
    }

    public getRootPath(resource?: Uri): string | undefined {
        if (!workspace.workspaceFolders) {
            return (
                workspace.rootPath ??
                (resource ? path.dirname(resource.fsPath) : undefined)
            );
        }

        let root: WorkspaceFolder | undefined;
        if (workspace.workspaceFolders.length === 1) {
            root = workspace.workspaceFolders[0];
        } else {
            if (!resource) {
                return undefined;
            }
            root = workspace.getWorkspaceFolder(resource);
        }

        return root?.uri.fsPath;
    }
}
