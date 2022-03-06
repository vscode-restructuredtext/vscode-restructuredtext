'use strict';

import * as vscode from 'vscode';
import { Configuration } from '../util/configuration';
import { RstTransformerSelector } from './selector';
import { RstTransformerConfig } from './confPyFinder';
import { Logger } from '../util/logger';
import { Python } from '../util/python';

/**
 * Status bar updates. Shows the selected RstTransformerConfig when a
 * restructuredtext document is active. If you click on the status bar
 * then the RstTransformerConfig is reset and you will need to select from
 * the menu when the preview is generated next time.
 */
export default class RstTransformerStatus {
    private _statusBarItem: vscode.StatusBarItem;
    public config: RstTransformerConfig;
    private _logger: Logger;
    private python: Python;

    constructor(python: Python, logger: Logger) {
        this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        this._statusBarItem.command = 'restructuredtext.resetStatus';
        this._logger = logger;
        this.python = python;
    }

    public setLabel() {
        if (this.config) {
            this._statusBarItem.text = this.config.label;
            this._statusBarItem.tooltip = this.config.tooltip;
        }
    }

    public async update() {
        const editor = vscode.window.activeTextEditor;
        if (editor != null && editor.document.languageId === 'restructuredtext') {
            const resource = editor.document.uri;
            const workspaceRoot = Configuration.GetRootPath(resource);
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
        if (editor != null && editor.document.languageId === 'restructuredtext') {
            let resource = editor.document.uri;
            this._logger.log("[preview] reset config.");
            const newValue = await Configuration.setConfPath(undefined, resource, false);
            if (newValue !== undefined) {
                this._logger.log("[preview] reset failed.");
            }
            await this.refreshConfig(resource);
            this.setLabel();
        }
    }

    public async refreshConfig(resource: vscode.Uri): Promise<RstTransformerConfig> {
        const rstTransformerConf = await RstTransformerSelector.findConfDir(resource, this._logger);
        if (rstTransformerConf == null) {
            return null;
        }

        this.config = rstTransformerConf;
        this._logger.log("[preview] set config to " + rstTransformerConf.confPyDirectory);
        await Configuration.setConfPath(rstTransformerConf.confPyDirectory, resource, true);
        // Porting over the setting.
        const section = vscode.workspace.getConfiguration("esbonio");
        const confDir = Configuration.getConfPath();
        if (confDir) {
            await section.update("sphinx.confDir", confDir);
        }
        return rstTransformerConf;
    }
}
