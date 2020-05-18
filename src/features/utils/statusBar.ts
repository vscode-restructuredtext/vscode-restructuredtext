'use strict';

import { StatusBarAlignment, StatusBarItem, window, Uri } from 'vscode';
import { Configuration } from './configuration';
import { RstTransformerSelector } from './selector';
import { RstTransformerConfig } from './confPyFinder';
import { Logger } from '../../logger';
import { Python } from '../../python';

/**
 * Status bar updates. Shows the selected RstTransformerConfig when a
 * restructuredtext document is active. If you click on the status bar
 * then the RstTransformerConfig is reset and you will need to select from
 * the menu when the preview is generated next time.
 */
export default class RstTransformerStatus {
    private _statusBarItem: StatusBarItem;
    public config: RstTransformerConfig;
    private _logger: Logger;
    private python: Python;

    constructor(python: Python, logger: Logger) {
        this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
        this._statusBarItem.command = 'restructuredtext.resetStatus';
        this._statusBarItem.tooltip = 'The active rst to html transformer (click to reset)';
        this._logger = logger;
        this.python = python;
    }

    public setLabel() {
        if (this.config) {
            this._statusBarItem.text = this.config.label;
        }
    }

    public async update() {
        const editor = window.activeTextEditor;
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
        const editor = window.activeTextEditor;
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

    public async refreshConfig(resource: Uri): Promise<RstTransformerConfig> {
        const rstTransformerConf = await RstTransformerSelector.findConfDir(resource, this._logger);
        if (rstTransformerConf == null) {
            return null;
        }

        this.config = rstTransformerConf;
        this._logger.log("[preview] set config to " + rstTransformerConf.confPyDirectory);
        await Configuration.setConfPath(rstTransformerConf.confPyDirectory, resource, true);
        return rstTransformerConf;
    }
}
