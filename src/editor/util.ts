// ============================================================
// Copyright (c) 2021 Tatsuya Nakamori. All rights reserved.
// See LICENSE in the project root for license information.
// ============================================================
import * as vscode from 'vscode';
import * as i18n from './i18n';

export function getOpenedWorkfolderUri(): vscode.Uri | undefined {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders?.length) {
        console.log(i18n.localize('resttext.sphinx.workspaceFolders.error'));
        return;
    }
    return workspaceFolders[0].uri;
}

export function getTextAtOffsetPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
    offset: number
): string | undefined {
    const curLine = position.line;
    const curChar = position.character;
    const newChar = curChar + offset;
    const lineEndChar = document.lineAt(curLine).range.end.character;

    if (newChar < 0 || newChar > lineEndChar) {
        return;
    }

    const range = new vscode.Range(curLine, curChar, curLine, newChar);
    return document.getText(range);
}

export function isSelectingLastChara(): boolean | undefined {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    const selPosition = editor.selection.start;
    const lineEndPosition = editor.document.lineAt(selPosition.line).range.end;
    const isLastIndex = selPosition.isEqual(lineEndPosition);

    return isLastIndex;
}

export function isAscii(text: string): boolean {
    // eslint-disable-next-line no-control-regex
    if (text.match(/[\x01-\x7E\xA1-\xDF]/)) {
        return true;
    } else {
        return false;
    }
}

export function countTextWidth(text: string): number {
    let count = 0;
    for (let i = 0; i < text.length; i++) {
        const chr = text[i];
        if (isAscii(chr)) {
            count += 1;
        } else {
            count += 2;
        }
    }
    return count;
}

export function tableSizeIsSelected(
    editor?: vscode.TextEditor
): [number, number] {
    if (!editor) {
        editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
    }

    const selection = editor.selection;
    if (selection.isEmpty) {
        return;
    }
    const startPos = new vscode.Position(selection.start.line, 0);
    const endLine = selection.end.line;
    const endLastChar = editor.document.lineAt(endLine).range.end.character;
    const endPos = new vscode.Position(endLine, endLastChar);

    const data = editor.document.getText(new vscode.Range(startPos, endPos));
    const regRowColumn = /^(?<row>\d+)(?<x>x)(?<column>\d+)$/;
    const match = regRowColumn.exec(data);
    if (!match?.groups) {
        return;
    }

    const rowText = match.groups['row'];
    const x = match.groups['x'];
    const columnText = match.groups['column'];
    if (!(rowText && x && columnText)) {
        return;
    }

    return [Number(rowText), Number(columnText)];
}

export function tableIsSelected(
    editor?: vscode.TextEditor
): number[] | undefined {
    if (!editor) {
        editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
    }
    const curLine = editor.selection.start.line;

    const regTableBegin = /^(\+-[-+]+-\+)$/;
    const regTableEnd = /^(?!(\s|\+|\||-))(?<!\w+)/;

    const allText = editor.document.getText();
    const allTextSplit = allText.split(/\r\n|\r|\n/);

    let tableLines: number[] = [];
    let inTheTable = false;
    for (let i = 0; i < allTextSplit.length; i++) {
        const textLine = allTextSplit[i];

        if (!inTheTable) {
            const match = regTableBegin.exec(textLine);
            if (match) {
                tableLines.push(i);
                inTheTable = true;
            }
        } else {
            const match = regTableEnd.exec(textLine);
            if (match) {
                inTheTable = false;
                if (tableLines.includes(curLine)) {
                    return tableLines;
                } else {
                    tableLines = [];
                }
            } else {
                tableLines.push(i);
            }
        }
    }

    if (tableLines.includes(curLine)) {
        return tableLines;
    } else {
        return;
    }
}

export function listIsSelected(editor?: vscode.TextEditor): boolean {
    if (!editor) {
        editor = vscode.window.activeTextEditor;
        if (!editor) {
            return false;
        }
    }
    const curLine = editor.selection.start.line;

    const regListLine = /^\s*((\(?([a-zA-Z0-9]+|#)(\.|\))) )|^\s*([-+*] )/;
    const curLineRange = editor.document.lineAt(curLine).range;
    const curLineText = editor.document.getText(curLineRange);
    const match = regListLine.exec(curLineText);
    if (match) {
        return true;
    } else {
        return false;
    }
}

export function listExistsOneLineAbove(editor?: vscode.TextEditor): boolean {
    if (!editor) {
        editor = vscode.window.activeTextEditor;
        if (!editor) {
            return false;
        }
    }
    const curLine = editor.selection.start.line;

    const regListLine = /^\s*((\(?([a-zA-Z0-9]+|#)(\.|\))) )|^\s*([-+*] )/;
    if (curLine === 0) {
        return false;
    } else {
        const oneLineAboveRange = editor.document.lineAt(curLine - 1).range;
        const oneLineAboveText = editor.document.getText(oneLineAboveRange);

        const match = regListLine.exec(oneLineAboveText);
        if (match) {
            return true;
        } else {
            return false;
        }
    }
}
