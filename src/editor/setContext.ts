// ============================================================
// Copyright (c) 2021 Tatsuya Nakamori. All rights reserved.
// See LICENSE in the project root for license information.
// ============================================================
import * as vscode from 'vscode';
import * as util from './util';


export async function setContext() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        vscode.commands.executeCommand('setContext', 'resttext.editor.opening', true);
    } else {
        vscode.commands.executeCommand('setContext', 'resttext.editor.opening', false);
        return
    }

    const tableSizeIsSelected = util.tableSizeIsSelected(editor);
    if (tableSizeIsSelected) {
        vscode.commands.executeCommand('setContext', 'resttext.createGrid.enabled', true);
    } else {
        vscode.commands.executeCommand('setContext', 'resttext.createGrid.enabled', false);
    }

    const tableIsSelected = util.tableIsSelected(editor);
    const listIsSelected = util.listIsSelected(editor);
    const listExistsOneLineAbove = util.listExistsOneLineAbove(editor);

    // Conditions under which the Enter(Shift+Enter) button is enabled
    if (tableIsSelected/* || listIsSelected*/) {
        vscode.commands.executeCommand('setContext', 'resttext.enter.enabled', true);
        vscode.commands.executeCommand('setContext', 'resttext.shift.enter.enabled', true);
    } else {
        vscode.commands.executeCommand('setContext', 'resttext.enter.enabled', false);
        vscode.commands.executeCommand('setContext', 'resttext.shift.enter.enabled', false);
    }

    // Alt+Enter (Table - New Line)
    const selectedLastChara = util.isSelectingLastChara();
    if (tableIsSelected && !selectedLastChara) {
        vscode.commands.executeCommand('setContext', 'resttext.alt.enter.enabled', true);
    } else {
        vscode.commands.executeCommand('setContext', 'resttext.alt.enter.enabled', false);
    }

    // Conditions under which the Tab button is enabled
    if (tableIsSelected || /*listIsSelected ||*/ listExistsOneLineAbove) {
        vscode.commands.executeCommand('setContext', 'resttext.tab.enabled', true);
    } else {
        vscode.commands.executeCommand('setContext', 'resttext.tab.enabled', false);
    }

    // Conditions under which the [Shift+Tab] button is enabled
    if (tableIsSelected/* || listIsSelected*/) {
        vscode.commands.executeCommand('setContext', 'resttext.shift.tab.enabled', true);
    } else {
        vscode.commands.executeCommand('setContext', 'resttext.shift.tab.enabled', false);
    }
}
