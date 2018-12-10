'use strict';

import { StatusBarAlignment, StatusBarItem, window, Uri, OutputChannel } from 'vscode';
import { Configuration } from './configuration';
import { RstTransformerSelector } from './selector';
import { RstTransformerConfig } from './confPyFinder';

/**
 * Status bar updates. Shows the selected RstTransformerConfig when a
 * restructuredtext document is active. If you click on the status bar
 * then the RstTransformerConfig is reset and you will need to select from
 * the menu when the preview is generated next time.
 */
export default class RstTransformerStatus {
    private _statusBarItem: StatusBarItem;
    public config: RstTransformerConfig;
    private _channel: OutputChannel;

    constructor(channel: OutputChannel) {
        this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
        this._statusBarItem.command = 'restructuredtext.resetStatus';
        this._statusBarItem.tooltip = 'The active rst to html transformer (click to reset)';
        this._channel = channel;
    }

    public setLabel() {
        this._statusBarItem.text = this.config.label;
    }

    public async update() {
        const editor = window.activeTextEditor;
        if (editor != null && editor.document.languageId === 'restructuredtext') {
            if (!this.config) {
                let resource = editor.document.uri;
                await this.refreshConfig(resource);
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
            await Configuration.setConfPath(undefined, resource, false);
            this.refreshConfig(resource);
            this.setLabel();
        }
    }

    public async refreshConfig(resource: Uri): Promise<RstTransformerConfig> {
        const rstTransformerConf = await RstTransformerSelector.findConfDir(resource, this._channel);
        if (rstTransformerConf == null) {
            return null;
        }

        this.config = rstTransformerConf;
        await Configuration.setConfPath(rstTransformerConf.confPyDirectory, resource, true);
        return rstTransformerConf;
    }
}
