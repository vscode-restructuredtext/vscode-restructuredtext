import * as vscode from "vscode";
import { key_alt_enter, key_enter, key_shift_enter, key_shift_tab, key_tab } from "./commands";

import { EditorCommands, VSCodeInput } from "./link";
import { TableEditor } from "./tableEditor";
import { underline } from "./underline";

export async function activate(context: vscode.ExtensionContext) {
    let editorCommands = new EditorCommands(new VSCodeInput())
    editorCommands.register(context)

    // Section creation support.
    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('restructuredtext.features.underline.underline', underline),
        vscode.commands.registerTextEditorCommand('restructuredtext.features.underline.underlineReverse',
            (textEditor, edit) => underline(textEditor, edit, true)),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('resttext.table.createGrid', () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) { return }
            const table = new TableEditor(editor);
            table.createEmptyGrid();
        }));

    context.subscriptions.push(
        vscode.commands.registerCommand('resttext.table.dataToTable', () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) { return }
            const table = new TableEditor(editor);
            table.dataToTable();
        }));

    context.subscriptions.push(
        vscode.commands.registerCommand('resttext.key.enter', () => {
            key_enter();
        }));

    context.subscriptions.push(
        vscode.commands.registerCommand('resttext.key.shift.enter', () => {
            key_shift_enter();
        }));

    context.subscriptions.push(
        vscode.commands.registerCommand('resttext.key.alt.enter', () => {
            key_alt_enter();
        }));

    context.subscriptions.push(
        vscode.commands.registerCommand('resttext.key.tab', () => {
            key_tab();
        }));

    context.subscriptions.push(
        vscode.commands.registerCommand('resttext.key.shift.tab', () => {
            key_shift_tab();
        }));
}