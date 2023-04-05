'use strict';

import * as vscode from 'vscode';
import {Configuration} from '../util/configuration';
import {ConfigFileSelector} from './selector';
import {ConfigFileOption} from './configFinder';
import {Logger} from '../util/logger';
import {Python} from '../util/python';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {NAMES, TYPES} from '../types';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {inject, injectable, named} from 'inversify';
import {
  commandResetActiveFolder,
  commandResetSelectedFile,
  commandSyncSelectedFile,
} from '../util/constants';

@injectable()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class ActiveFolderStatus {
  private _statusBarItem: vscode.StatusBarItem;
  public folder: string;
  private inReset: boolean;

  constructor(
    @inject(TYPES.Logger) @named(NAMES.Main) private logger: Logger,
    @inject(TYPES.Configuration) private configuration: Configuration
  ) {
    this._statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left
    );
    this._statusBarItem.command = commandResetActiveFolder;
    this.inReset = false;
    this.folder = this.configuration.getActiveFolder();
  }

  public setLabel() {
    if (this.folder) {
      this._statusBarItem.text = `$(folder) ${this.folder}`;
      this._statusBarItem.tooltip = `Active folder of current workspace is ${this.folder}. Click to reset.`;
      this.configuration.setActiveFolder(this.folder);
    }
  }

  public async update() {
    if (!this.folder) {
      await this.refreshFolder();
    }

    this.setLabel();
    this._statusBarItem.show();
  }

  public async reset() {
    this.logger.log('[preview] Resetting active folder');
    this.inReset = true;
    try {
      await this.refreshFolder();
      this.setLabel();
      vscode.commands.executeCommand(commandSyncSelectedFile);
    } finally {
      this.inReset = false;
    }
  }

  public async refreshFolder(): Promise<string | undefined> {
    let folder: string | undefined = this.folder;
    if (this.inReset) {
      const workspaceFolders = vscode.workspace.workspaceFolders!.map(
        folder => {
          return {
            label: folder.name,
            description: folder.uri.fsPath,
            folder: folder,
          };
        }
      );
      const selected = await vscode.window.showQuickPick(workspaceFolders, {
        placeHolder: 'Select a worksapce folder',
      });
      folder = selected?.label;
    }
    if (folder === undefined || folder === '') {
      folder = vscode.workspace.workspaceFolders![0].name;
    }

    this.folder = folder;
    this.logger.log(`[preview] set active folder is ${folder}`);
    await this.configuration.setActiveFolder(folder);
    return folder;
  }
}
/**
 * Status bar updates. Shows the selected RstTransformerConfig when a
 * restructuredtext document is active. If you click on the status bar
 * then the RstTransformerConfig is reset and you will need to select from
 * the menu when the preview is generated next time.
 */
@injectable()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default class SelectedConfigFileStatus {
  private _statusBarItem: vscode.StatusBarItem;
  public config: ConfigFileOption | undefined;
  private inReset: boolean;

  constructor(
    @inject(TYPES.Python) private python: Python,
    @inject(TYPES.Logger) @named(NAMES.Main) private logger: Logger,
    @inject(TYPES.Configuration) private configuration: Configuration,
    @inject(TYPES.TransformSelector)
    private selector: ConfigFileSelector,
    private singleFolder: boolean
  ) {
    this._statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left
    );
    this._statusBarItem.command = commandResetSelectedFile;
    this.inReset = false;
  }

  public setLabel(resource: vscode.Uri) {
    if (this.config) {
      this._statusBarItem.text = this.config.shortLabel;
      this._statusBarItem.tooltip = this.config.tooltip;
      this.configuration.setConfPath(
        this.config.configDirectory,
        resource,
        true
      );
    }
  }

  public async update() {
    let resource = vscode.workspace.workspaceFolders![0].uri;
    if (!this.singleFolder) {
      const folder = this.configuration.getActiveFolder();
      resource = vscode.workspace.workspaceFolders!.find(
        item => item.name === folder
      )!.uri;
    }

    const workspaceRoot = resource.fsPath;
    if (!this.config || this.config.workspaceRoot !== workspaceRoot) {
      await this.refreshConfig(resource);
    }

    this.setLabel(resource);
    this._statusBarItem.show();
  }

  public async reset(resource: vscode.Uri) {
    if (!vscode.workspace.workspaceFolders) {
      return;
    }

    if (JSON.stringify(resource) === '{}') {
      vscode.window.showErrorMessage(
        'Please select a folder to start configuration.'
      );
      return;
    }

    if (!resource) {
      resource = vscode.workspace.workspaceFolders[0].uri;
      if (!this.singleFolder) {
        const folder = this.configuration.getActiveFolder();
        resource = vscode.workspace.workspaceFolders!.find(
          item => item.name === folder
        )!.uri;
      }
    }

    this.logger.log('[preview] Resetting config');
    this.inReset = true;
    try {
      await this.refreshConfig(resource);
      this.setLabel(resource);
    } finally {
      this.inReset = false;
    }
  }

  public async refreshConfig(
    resource: vscode.Uri
  ): Promise<ConfigFileOption | undefined> {
    const configDir = await this.selector.findConfDir(this.inReset, resource);
    if (configDir === undefined) {
      return undefined;
    }

    this.config = configDir;
    this.logger.log(`[preview] set config is ${configDir.configDirectory}`);
    await this.configuration.setPreviewName(configDir.engine, resource);
    await this.configuration.setConfPath(
      configDir.configDirectory,
      resource,
      true
    );
    return configDir;
  }
}
