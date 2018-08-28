/**
 * This module provides utility functions to handle underline title levels
 */
import * as vscode from 'vscode';

// list of underline characters, from higher level to lower level
// Use the recommended items from http://docutils.sourceforge.net/docs/ref/rst/restructuredtext.html#sections,
// and remove '`' and '_' as the syntax file does not like them.
const underlineChars = ['=', '-', ':', '.', "'", '"', '~', '^', '*', '+', '#'];

/**
 * Analyze current underline char and return the underline character corresponding
 * to the next subtitle level.
 *
 * @param current - The current underline character
 * @return - The next underline char in the list of precedence
 */
export function nextUnderlineChar(current: string): string {
    const nextCharIndex = (underlineChars.indexOf(current + 1) % underlineChars.length);
    return underlineChars[nextCharIndex];
}

/**
 * Check if current line is followed by a line of underline characters. If true, return
 * the underline character, otherwise return null.
 *
 * @param currentLine - current line of text under cursor
 * @param nextLine - next line of text
 * @return - the current underline character if any or null
 */
export function currentUnderlineChar(currentLine: string, nextLine: string): string {
    for (const char of underlineChars) {
        if (nextLine.length >= currentLine.length && nextLine === char.repeat(nextLine.length)) {
            return char;
        }
    }
    return null;
}

/**
 * Underline current line. If it's already underlined, pick up the underline character
 * corresponding to the nextitle level and replace the current underline.
 */
export function underline(textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit) {
    textEditor.selections.forEach((selection) => {
        const position = selection.active;
        const line = textEditor.document.lineAt(position.line).text;
        if (line === '') {
            return; // don't underline empty lines
        }

        let underlineChar = null;
        let nextLine = null;
        if (position.line < textEditor.document.lineCount - 1) {
            nextLine = textEditor.document.lineAt(position.line + 1).text;
            underlineChar = currentUnderlineChar(line, nextLine);
        }

        if (underlineChar === null) {
            edit.insert(
                new vscode.Position(position.line, line.length),
                '\n' + '='.repeat(line.length),
            );
        } else {
            const nextLineRange = new vscode.Range(
                new vscode.Position(position.line + 1, 0),
                new vscode.Position(position.line + 1, nextLine.length),
            );
            edit.replace(
                nextLineRange,
                nextUnderlineChar(underlineChar).repeat(line.length),
            );
        }
    });
}
