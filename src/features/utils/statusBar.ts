"use strict"

import { window, StatusBarItem, StatusBarAlignment, OutputChannel } from 'vscode';


/**
 * Status bar updates. Shows the selected RstTransformerConfig when a
 * restructuredtext document is active. If you click on the status bar
 * then the RstTransformerConfig is reset and you will need to select from
 * the menu when the preview is generated next time.
 */
export default class RstTransformerStatus {
    private _statusBarItem: StatusBarItem;
    private _selectedConfig: string = "";

    constructor() {
        this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
        this._statusBarItem.command = "restructuredtext.resetRstTransformer";
        this._statusBarItem.tooltip = "The active rst to html transformer (click to reset)";
    }

    setConfiguration(conf: string) {
        this._selectedConfig = conf;
        this.update();
    }

    update() {
        let editor = window.activeTextEditor;

        if (this._selectedConfig &&
            // editor is null for the preview window
            (editor == null || editor.document.languageId === 'restructuredtext')) {
            this._statusBarItem.text = this._selectedConfig;
            this._statusBarItem.show();
        }
        else {
            this._statusBarItem.hide();
        }
    }
}