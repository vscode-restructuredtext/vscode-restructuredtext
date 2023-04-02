'use strict';

import * as vscode from 'vscode';
import {Configuration} from '../util/configuration';
import {RstTransformerSelector} from './selector';
import {RstTransformerConfig} from './confPyFinder';
import {Logger} from '../util/logger';
import {Python} from '../util/python';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {NAMES, TYPES} from '../types';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {inject, injectable, named} from 'inversify';

/**
 * Status bar updates. Shows the selected RstTransformerConfig when a
 * restructuredtext document is active. If you click on the status bar
 * then the RstTransformerConfig is reset and you will need to select from
 * the menu when the preview is generated next time.
 */
@injectable()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default class RstTransformerStatus {
  private _statusBarItem: vscode.StatusBarItem;
  public config: RstTransformerConfig;
  private inReset: boolean;

  constructor(
    @inject(TYPES.Python) private python: Python,
    @inject(TYPES.Logger) @named(NAMES.Main) private logger: Logger,
    @inject(TYPES.Configuration) private configuration: Configuration,
    @inject(TYPES.TransformSelector)
    private selector: RstTransformerSelector
  ) {
    this._statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left
    );
    this._statusBarItem.command = 'restructuredtext.resetStatus';
  }

  public setLabel() {
    if (this.config) {
      this._statusBarItem.text = this.config.shortLabel;
      this._statusBarItem.tooltip = this.config.tooltip;
    }
  }

  public async update() {
    const editor = vscode.window.activeTextEditor;
    if (editor !== null && editor.document.languageId === 'restructuredtext') {
      const resource = editor.document.uri;
      const workspaceRoot = this.configuration.getRootPath(resource);
      if (!this.config || this.config.workspaceRoot !== workspaceRoot) {
        await this.refreshConfig(resource);
        this.python.setup(resource);
      }

      this.setLabel();
      this._statusBarItem.show();
    } else {
      this._statusBarItem.hide();
    }
  }

  public async reset() {
    const editor = vscode.window.activeTextEditor;
    if (editor !== null && editor.document.languageId === 'restructuredtext') {
      const resource = editor.document.uri;
      this.logger.log('[preview] reset config.');
      this.inReset = true;
      try {
        await this.refreshConfig(resource);
        this.setLabel();
      } finally {
        this.inReset = false;
      }
    }
  }

  public async refreshConfig(
    resource: vscode.Uri
  ): Promise<RstTransformerConfig> {
    const rstTransformerConf = await this.selector.findConfDir(
      resource,
      this.inReset
    );
    if (rstTransformerConf === null) {
      return null;
    }

    this.config = rstTransformerConf;

    if (rstTransformerConf.engine === 'docutils') {
      this.logger.log('[preview] engine set to docutils');
      await this.configuration.setPreviewName('docutils', resource);
    } else {
      this.logger.log(
        '[preview] set config to ' + rstTransformerConf.confPyDirectory
      );
      await this.configuration.setPreviewName('sphinx', resource);
      await this.configuration.setConfPath(
        rstTransformerConf.confPyDirectory,
        resource,
        true
      );
    }

    return rstTransformerConf;
  }
}
