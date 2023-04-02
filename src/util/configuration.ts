'use strict';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {injectable} from 'inversify';
import fs = require('fs');
import path = require('path');
import {
  extensions,
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

  public getDocutilsWriter(resource?: Uri): string | undefined {
    return this.loadSetting('docutilsWriter', 'html', resource);
  }

  public getDocutilsWriterPart(resource?: Uri): string | undefined {
    return this.loadSetting('docutilsWriterPart', 'html_body', resource);
  }

  public getConfPath(resource?: Uri): string | undefined {
    return this.loadSetting('sphinx.confDir', '', resource, true, 'esbonio');
  }

  public getOutputFolder(resource?: Uri): string | undefined {
    return this.loadSetting(
      'sphinx.buildDir',
      undefined,
      resource,
      true,
      'esbonio'
    );
  }

  public getSourcePath(resource?: Uri): string | undefined {
    return this.loadSetting(
      'sphinx.srcDir',
      undefined,
      resource,
      true,
      'esbonio'
    );
  }

  public getPreviewName(resource?: Uri): string | undefined {
    return this.loadSetting('preview.name', 'sphinx', resource);
  }

  public getDoc8Path(resource?: Uri): string | undefined {
    return this.loadSetting('linter.doc8.executablePath', undefined, resource);
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

  public getEsbonioSourceFolder(resource?: Uri): string | undefined {
    return this.getConfiguration('esbonio', resource).get<string>(
      'server.sourceFolder'
    );
  }

  public getEsbonioDebugLaunch(resource?: Uri): boolean {
    return this.getConfiguration('esbonio', resource).get<boolean>(
      'server.debugLaunch',
      false
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
          this.getConfiguration('python', resource).get<string>('pythonPath') ??
          Constants.python
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

  public getSphinxDisabled(resource?: Uri): boolean | undefined {
    return this.loadAnySetting('preview.sphinx.disabled', false, resource);
  }

  public getDocUtilDisabled(resource?: Uri): boolean | undefined {
    return this.loadAnySetting('preview.docutils.disabled', true, resource);
  }

  public getLanguageServerDisabled(resource?: Uri): boolean | undefined {
    return this.loadAnySetting('languageServer.disabled', true, resource);
  }

  public getSyntaxHighlightingDisabled(resource?: Uri): boolean | undefined {
    return this.loadAnySetting('syntaxHighlighting.disabled', false, resource);
  }

  public getTableEditorDisabled(resource?: Uri): boolean | undefined {
    return this.loadAnySetting('editor.tableEditor.disabled', false, resource);
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

  public getPythonRecommendationDisabled(resource?: Uri): boolean | undefined {
    return this.loadAnySetting(
      'pythonRecommendation.disabled',
      false,
      resource
    );
  }

  public async setPythonRecommendationDisabled(resource?: Uri) {
    await this.saveAnySetting('pythonRecommendation.disabled', true, resource);
  }

  public async setConfPath(
    value: string,
    resource?: Uri,
    insertMacro = true
  ): Promise<string | undefined> {
    return await this.saveSetting(
      'sphinx.confDir',
      value,
      resource,
      insertMacro,
      'esbonio'
    );
  }

  public async setPreviewName(value: string, resource?: Uri): Promise<string> {
    return await this.saveAnySetting('preview.name', value, resource);
  }

  public async setSphinxDisabled(resource?: Uri) {
    await this.saveAnySetting('preview.sphinx.disabled', true, resource);
  }

  public async setDocUtilDisabled(resource?: Uri) {
    await this.saveAnySetting('preview.docutils.disabled', true, resource);
  }

  public async setSyntaxHighlightingDisabled(resource?: Uri) {
    await this.saveAnySetting('syntaxHighlighting.disabled', true, resource);
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

  private async saveSetting(
    configSection: string,
    value: string,
    resource?: Uri,
    insertMacro = false,
    header = 'restructuredtext'
  ): Promise<string | undefined> {
    if (insertMacro) {
      value = this.insertMacro(value, resource);
    }
    return await this.saveAnySetting<string>(
      configSection,
      value,
      resource,
      header
    );
  }

  private insertMacro(input: string, resource?: Uri): string {
    if (!resource) {
      return input;
    }

    let path: string | undefined;
    if (!workspace.workspaceFolders) {
      path = workspace.rootPath;
    } else {
      let root: WorkspaceFolder | undefined;
      if (workspace.workspaceFolders.length === 1) {
        root = workspace.workspaceFolders[0];
      } else {
        root = workspace.getWorkspaceFolder(resource);
      }

      path = root?.uri.fsPath;
    }

    if (path && input.startsWith(path)) {
      return input.replace(path, '${workspaceFolder}');
    }
    return input;
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
