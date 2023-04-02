/**
 * This module provides utility functions to handle underline title levels
 */
import * as vscode from 'vscode';
import * as meaw from 'meaw';
import {Configuration} from '../util/configuration';
import container from '../inversify.config';
import {TYPES} from '../types';

const configuration = container.get<Configuration>(TYPES.Configuration);
const underlineChars = configuration.getAdornments();

/**
 * Analyze current underline char and return the underline character corresponding
 * to the next subtitle level.
 *
 * @param current - The current underline character
 * @return - The next underline char in the list of precedence
 */
export function nextUnderlineChar(current: string, reverse = false): string {
  const nextIndex = underlineChars.indexOf(current) + (reverse ? -1 : 1);
  const nextCharIndex =
    nextIndex >= 0
      ? nextIndex % underlineChars.length
      : nextIndex + underlineChars.length;
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
export function currentUnderlineChar(
  currentLine: string,
  nextLine: string
): string {
  for (const char of underlineChars) {
    if (
      nextLine.length >= currentLine.length &&
      nextLine === char.repeat(nextLine.length)
    ) {
      return char;
    }
  }
  return null;
}

/**
 * Underline current line. If it's already underlined, pick up the underline character
 * corresponding to the nextitle level and replace the current underline.
 */
export function underline(
  textEditor: vscode.TextEditor,
  edit: vscode.TextEditorEdit,
  reverse = false
) {
  textEditor.selections.forEach(selection => {
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

    const lineWidth = underlineWidth(line);
    if (underlineChar === null) {
      edit.insert(
        new vscode.Position(position.line, line.length),
        '\n' + '='.repeat(lineWidth)
      );
    } else {
      const nextLineRange = new vscode.Range(
        new vscode.Position(position.line + 1, 0),
        new vscode.Position(position.line + 1, nextLine.length)
      );
      const replacement = nextUnderlineChar(underlineChar, reverse);
      edit.replace(nextLineRange, replacement.repeat(lineWidth));
    }
  });
}

/**
 * Return the column width of unicode text.
 * See https://sourceforge.net/p/docutils/code/HEAD/tree/tags/docutils-0.14/docutils/utils/__init__.py#l643
 *
 * TODO: consider the count of combining chars same as docutils.
 */
export function underlineWidth(line: string): number {
  return meaw.computeWidth(line.normalize());
}
