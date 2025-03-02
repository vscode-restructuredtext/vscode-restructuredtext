// ============================================================
// Copyright (c) 2021 Tatsuya Nakamori. All rights reserved.
// See LICENSE in the project root for license information.
// ============================================================
import * as vscode from 'vscode';
import * as path from 'path';
import * as util from './util';
//import * as listEditor from './listEditor'
import * as tableEditor from './tableEditor';
//import * as completionItemProvider from './completionItemProvider'

// Add custom path parse function
const parse = (pathString: string) => {
    const sep = pathString.includes('/') ? '/' : '\\';
    const parts = pathString.split(sep);
    const base = parts[parts.length - 1] || '';
    const ext = base.includes('.') ? base.substring(base.lastIndexOf('.')) : '';
    const name = base.includes('.')
        ? base.substring(0, base.lastIndexOf('.'))
        : base;
    const dir = parts.slice(0, -1).join(sep);

    return {
        root: pathString.startsWith(sep) ? sep : '',
        dir,
        base,
        ext,
        name,
    };
};

export async function insertRelPath(pathTo: string, withExt: boolean) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    let pathFrom = editor.document.uri.fsPath;
    pathFrom = path.dirname(pathFrom);

    let relPath = path.relative(pathFrom, pathTo);
    relPath = relPath.replace(/\\/g, '/');

    if (!withExt) {
        const parsedPath = parse(relPath);
        if (parsedPath.dir) {
            relPath = `${parsedPath.dir}/${parsedPath.name}`;
        } else {
            relPath = parsedPath.name;
        }
    }

    await editor.edit(editBuilder => {
        editBuilder.replace(editor.selection, relPath);
    });
    const selectionEnd = editor.selection.end;
    editor.selection = new vscode.Selection(selectionEnd, selectionEnd);

    vscode.window.showTextDocument(editor.document);
}

export async function bold() {
    const removed: boolean = await _removeDecoChar('bold');
    if (!removed) {
        _addDecorationChar('**');
    }
}

export async function italic() {
    const removed: boolean = await _removeDecoChar('italic');
    if (!removed) {
        _addDecorationChar('*');
    }
}

export async function inlineRaw() {
    const removed: boolean = await _removeDecoChar('inlineRaw');
    if (!removed) {
        _addDecorationChar('``');
    }
}

async function _addDecorationChar(decoChar: string) {
    // Adds a decorative character to both sides of the selected character.
    // 選択されている文字の両隣に装飾文字を追加します。
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    const document = editor.document;
    const selections = editor.selections;

    const insertTextList: string[] = [];
    for (const selection of selections) {
        const selBeforeChr = util.getTextAtOffsetPosition(
            document,
            selection.start,
            -1
        );
        const selAfterChr = util.getTextAtOffsetPosition(
            document,
            selection.end,
            1
        );

        let addBefore = decoChar;
        let addAfter = decoChar;
        if (selBeforeChr && selBeforeChr !== ' ') {
            addBefore = ` ${decoChar}`;
        }
        if (selAfterChr && selAfterChr !== ' ') {
            addAfter = `${decoChar} `;
        }

        const text = document.getText(selection);
        insertTextList.push(`${addBefore}${text}${addAfter}`);
    }

    editor.edit(editBuilder => {
        for (let i = 0; i < selections.length; i++) {
            editBuilder.replace(selections[i], insertTextList[i]);
        }
    });
}

async function _removeDecoChar(
    decoType: 'bold' | 'italic' | 'inlineRaw'
): Promise<boolean> {
    function _removeDecoCharOneLine(
        line: string,
        startCharacter: number,
        endCharacter: number
    ) {
        if (startCharacter === endCharacter && endCharacter > line.length - 1) {
            startCharacter--;
            endCharacter--;
        }
        const lineSplit = line.split('');

        let regDecoChar: RegExp;
        if (decoType === 'bold') {
            regDecoChar =
                /(?<frontText>.*?)(?<frontDeco>(^|\s)\*\*)(?=\S)(?!\*{2,})(?<text>.*?)(?<=\S)(?<!\*{2,})(?<backDeco>\*\*(\s|$))(?<backText>.*)/;
        } else if (decoType === 'italic') {
            regDecoChar =
                /(?<frontText>.*?)(?<frontDeco>(^|\s)\*)(?=\S)(?!\*{1,})(?<text>.*?)(?<=\S)(?<!\*{1,})(?<backDeco>\*(\s|$))(?<backText>.*)/;
        } else if (decoType === 'inlineRaw') {
            regDecoChar =
                /(?<frontText>.*?)(?<frontDeco>(^|\s)``)(?=\S)(?!`{2,})(?<text>.*?)(?<=\S)(?<!`{2,})(?<backDeco>``(\s|$))(?<backText>.*)/;
        } else {
            // The TypeScript lint error messages are annoying, so I put in this else block (a block that is not really needed).
            // TypeScriptのlintのエラーメッセージがうるさいので、このelseブロックを入れている(本来は必要ないブロック)
            regDecoChar = new RegExp('');
        }

        interface RemovedDecoCharInfo {
            removedChar: string;
            position: 'front' | 'back';
        }
        const removedDecoCharsInfo: (string | RemovedDecoCharInfo)[] = [];
        // Mark whether the placement of each deco character is in the "front" or "back".
        // 各デコ文字の配置が、"front"にあるのか"back"にあるのかをマーキングする
        // Finally, generate an array separated by a single character (the marked character will contain a RemovedDecoCharInfo object).
        // 最終的に、1文字ずつ区切った配列を生成する(マーキングした文字は、RemovedDecoCharInfoオブジェクトが入る)
        // * Repeat if "regDecoChar" matches. ※"regDecoChar"がマッチする間、繰り返しを行います。
        do {
            const match = regDecoChar.exec(line);
            if (!match) {
                removedDecoCharsInfo.push(line);
                break;
            }
            const matchGrp = match.groups;
            if (!matchGrp) {
                break;
            }

            removedDecoCharsInfo.push(matchGrp['frontText']);
            const frontDecoText = matchGrp['frontDeco'];
            for (let i = 0; i < frontDecoText.length; i++) {
                removedDecoCharsInfo.push({
                    removedChar: frontDecoText[i],
                    position: 'front',
                });
            }
            removedDecoCharsInfo.push(matchGrp['text']);
            const backDecoText = matchGrp['backDeco'];
            for (let i = 0; i < backDecoText.length; i++) {
                removedDecoCharsInfo.push({
                    removedChar: backDecoText[i],
                    position: 'back',
                });
            }
            line = matchGrp['backText'];
        } while (line);

        let removedDecoCharSplit: (string | RemovedDecoCharInfo)[] = [];
        for (const removedDecoChar of removedDecoCharsInfo) {
            if (typeof removedDecoChar === 'string') {
                removedDecoCharSplit = removedDecoCharSplit.concat(
                    removedDecoChar.split('')
                );
            } else {
                removedDecoCharSplit.push(removedDecoChar);
            }
        }

        // From here, the actual deletion process (deciding whether to delete the deco characters or not and processing them)
        // ここから、実際の削除処理(デコ文字を削除するか、しないかを判断して処理する)
        interface AnalysisResults {
            analyzedForward: string[];
            analyzedSelRange: string[];
            analyzedBackward: string[];
        }
        const analysisResults: AnalysisResults = {
            analyzedForward: [],
            analyzedSelRange: [],
            analyzedBackward: [],
        };
        // Analyze Selection Range
        let needForwardContinuance: false | 'front' | 'back' = false;
        let needBackwardContinuance: false | 'front' | 'back' = false;
        let elementsOut: (string | RemovedDecoCharInfo)[];
        elementsOut = removedDecoCharSplit.slice(
            startCharacter,
            endCharacter + 1
        );
        for (let i = 0; i < elementsOut.length; i++) {
            const element = elementsOut[i];
            if (typeof element === 'string') {
                analysisResults.analyzedSelRange.push(element);
            } else {
                if (i === 0) {
                    needForwardContinuance = element.position;
                }
                if (i === elementsOut.length - 1) {
                    needBackwardContinuance = element.position;
                }
            }
        }
        // Analyze Forward
        let hasRemovedDecoChar = false;
        let frontExclusionStatus: null | 'inExclusion' | 'finished' = null;
        elementsOut = removedDecoCharSplit.slice(0, startCharacter);
        elementsOut = elementsOut.reverse();
        if (needForwardContinuance === 'front') {
            frontExclusionStatus = 'inExclusion';
        }
        for (const element of elementsOut) {
            if (typeof element === 'string') {
                analysisResults.analyzedForward.unshift(element);
                if (frontExclusionStatus === 'inExclusion') {
                    frontExclusionStatus = 'finished';
                }
            } else {
                if (needForwardContinuance === 'back') {
                    if (element.position === 'front' && !frontExclusionStatus) {
                        frontExclusionStatus = 'inExclusion';
                    }
                    if (frontExclusionStatus === 'finished') {
                        analysisResults.analyzedForward.unshift(
                            element.removedChar
                        );
                    }
                } else {
                    if (hasRemovedDecoChar) {
                        analysisResults.analyzedForward.unshift(
                            element.removedChar
                        );
                    } else if (element.position === 'back') {
                        analysisResults.analyzedForward.unshift(
                            element.removedChar
                        );
                        hasRemovedDecoChar = true;
                    }
                }
            }
        }
        // Analyze Backward
        hasRemovedDecoChar = false;
        let backExclusionStatus: null | 'inExclusion' | 'finished' = null;
        elementsOut = removedDecoCharSplit.slice(
            endCharacter + 1,
            lineSplit.length
        );
        if (needBackwardContinuance === 'back') {
            backExclusionStatus = 'inExclusion';
        }
        for (const element of elementsOut) {
            if (typeof element === 'string') {
                analysisResults.analyzedBackward.push(element);
                if (backExclusionStatus === 'inExclusion') {
                    backExclusionStatus = 'finished';
                }
            } else {
                if (needBackwardContinuance === 'front') {
                    if (element.position === 'back' && !backExclusionStatus) {
                        backExclusionStatus = 'inExclusion';
                    }
                    if (backExclusionStatus === 'finished') {
                        analysisResults.analyzedBackward.push(
                            element.removedChar
                        );
                    }
                } else {
                    if (hasRemovedDecoChar) {
                        analysisResults.analyzedBackward.push(
                            element.removedChar
                        );
                    } else if (element.position === 'front') {
                        analysisResults.analyzedBackward.push(
                            element.removedChar
                        );
                        hasRemovedDecoChar = true;
                    }
                }
            }
        }

        let finalResult: string[] = [];
        finalResult = finalResult.concat(analysisResults.analyzedForward);
        finalResult = finalResult.concat(analysisResults.analyzedSelRange);
        finalResult = finalResult.concat(analysisResults.analyzedBackward);
        return finalResult.join('');
    }

    // ====================
    // main process
    // ====================
    // Whether the modifier was removed or not is passed as the last return value.
    // 修飾文字が削除されたかどうかを、最後に返り値として渡す
    let _removed = false;

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return _removed;
    }

    const curSelections: vscode.Selection[] = [];
    const document = editor.document;
    const selections = editor.selections;
    for (const selection of selections) {
        const startLine = selection.start.line;
        const startChar = selection.start.character;
        const startLineEndChar = document.lineAt(startLine).range.end.character;
        const endLine = selection.end.line;
        const endChar = selection.end.character;
        const endLineEndChar = document.lineAt(endLine).range.end.character;
        curSelections.push(
            new vscode.Selection(startLine, startChar, endLine, endChar)
        );

        // The fullRange is the selected line with start and end at the beginning and end.
        // 選択されている行の中で、startとendの位置が先頭と最後まである状態のものをfullRangeとする
        const fullRange = new vscode.Range(
            startLine,
            0,
            endLine,
            endLineEndChar
        );
        const fullText = document.getText(fullRange);
        const fullLines = fullText.split(/\r\n|\r|\n/);

        const newLines: string[] = [];
        for (let i = 0; i < fullLines.length; i++) {
            const line = fullLines[i];

            if (i === 0) {
                if (selection.isSingleLine) {
                    const newLine = _removeDecoCharOneLine(
                        line,
                        startChar,
                        endChar
                    );
                    newLines.push(newLine);
                    if (line !== newLine) {
                        _removed = true;
                    }
                } else {
                    const newLine = _removeDecoCharOneLine(
                        line,
                        startChar,
                        startLineEndChar
                    );
                    newLines.push(newLine);
                    if (line !== newLine) {
                        _removed = true;
                    }
                    continue;
                }
            } else if (i === fullLines.length - 1) {
                const newLine = _removeDecoCharOneLine(line, 0, endChar);
                newLines.push(newLine);
                if (line !== newLine) {
                    _removed = true;
                }
                continue;
            } else {
                const newLine = _removeDecoCharOneLine(line, 0, line.length);
                newLines.push(newLine);
                if (line !== newLine) {
                    _removed = true;
                }
                continue;
            }
        }

        await editor.edit(editBuilder => {
            const newText = newLines.join('\n');
            editBuilder.replace(fullRange, newText);
        });
    }
    editor.selections = curSelections;

    return _removed;
}

export function list() {
    //listEditor.moveSelectionPositionForCompletion();
    vscode.commands.executeCommand('editor.action.triggerSuggest');
}

export function heading() {
    vscode.commands.executeCommand('editor.action.triggerSuggest');
}

export async function addHeading(_triggerChar: string) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    const document = editor.document;
    const selections = editor.selections;

    for (let i = 0; i < selections.length; i++) {
        const selection = selections[i];
        const curSelectionLine = selection.start.line;

        let insertText = `${_triggerChar.repeat(5)}\n\n`;
        if (curSelectionLine > 0) {
            const oneLineRangeAbove = editor.document.lineAt(
                curSelectionLine - 1
            ).range;
            const oneLineRangeAboveEndCharNumber =
                oneLineRangeAbove.end.character;

            if (oneLineRangeAboveEndCharNumber > 0) {
                const lineText = document.getText(oneLineRangeAbove);
                const strCount = util.countTextWidth(lineText);

                if (strCount > 5) {
                    insertText = `${_triggerChar.repeat(strCount)}\n`;
                }
            }
        }

        const range = editor.document.lineAt(curSelectionLine).range;
        await editor.edit(editBuilder => {
            editBuilder.replace(range, insertText);
        });
    }

    const selection = editor.selection;
    const newSelection = new vscode.Selection(selection.end, selection.end);
    editor.selection = newSelection;
}

export async function key_enter() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    if (util.tableIsSelected(editor)) {
        const prevTwoLetters = util.getTextAtOffsetPosition(
            editor.document,
            editor.selection.end,
            -2
        );
        const postLetter = util.getTextAtOffsetPosition(
            editor.document,
            editor.selection.end,
            1
        );
        const prevLetter = util.getTextAtOffsetPosition(
            editor.document,
            editor.selection.end,
            -1
        );

        const table = new tableEditor.TableEditor(editor);

        // Normal line feed [通常の改行]
        if (table.isSelectedFirstGrid()) {
            const curLine = editor.selection.start.line;
            const curLineFirstChar =
                editor.document.lineAt(curLine).range.start.character;
            const newPos = new vscode.Position(curLine, curLineFirstChar);
            editor.selection = new vscode.Selection(newPos, newPos);

            _addNewLine();
            return;
        } else if (table.isSelectedLastGrid()) {
            const curLine = editor.selection.end.line;
            const curLineLastChar =
                editor.document.lineAt(curLine).range.end.character;
            const newPos = new vscode.Position(curLine, curLineLastChar);
            editor.selection = new vscode.Selection(newPos, newPos);

            _addNewLine();
            return;
        }

        // Add Row
        if (util.isSelectingLastChara() && prevLetter === '|') {
            table.addRow();

            // Add Column
        } else if (
            prevTwoLetters === '|+' ||
            (prevLetter === '+' && postLetter === '|')
        ) {
            table.addColumn();

            // Remove Column/ Remove Row
        } else if (
            prevTwoLetters === '|-' ||
            (prevLetter === '-' && postLetter === '|')
        ) {
            if (util.isSelectingLastChara()) {
                table.removeRow();
            } else {
                const regStartWithMinusSymbol = /^(-\|)/;
                const curLine = editor.selection.end.line;
                const curLineText = editor.document.lineAt(curLine).text;
                const startWithMatch =
                    regStartWithMinusSymbol.exec(curLineText);

                if (startWithMatch) {
                    table.removeRow();
                } else {
                    table.removeColumn();
                }
            }

            // Move Column To Right
        } else if (
            prevTwoLetters === '|>' ||
            prevTwoLetters === '>>' ||
            (prevLetter === '>' && postLetter === '|')
        ) {
            table.moveColumn('right');

            // Move Column To Left
        } else if (
            prevTwoLetters === '|<' ||
            prevTwoLetters === '<<' ||
            (prevLetter === '<' && postLetter === '|')
        ) {
            table.moveColumn('left');

            // Move Column To Top
        } else if (
            prevTwoLetters === '|^' ||
            prevTwoLetters === '^^' ||
            (prevLetter === '^' && postLetter === '|')
        ) {
            table.moveRow('top');

            // Move Column To Buttom
        } else if (
            prevTwoLetters === '|v' ||
            prevTwoLetters === 'vv' ||
            (prevLetter === 'v' && postLetter === '|')
        ) {
            table.moveRow('bottom');

            // Select a cell down
        } else {
            table.selectionChange('buttom');
        }
    } else if (util.listIsSelected(editor)) {
        //listEditor.addLine("next", editor);
    }
}

export async function key_shift_enter() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    if (util.tableIsSelected(editor)) {
        const table = new tableEditor.TableEditor(editor);
        table.selectionChange('top');
    } else if (util.listIsSelected(editor)) {
        //listEditor.addLine("prev", editor);
    }
}

export async function key_alt_enter() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    if (util.tableIsSelected(editor) && !util.isSelectingLastChara()) {
        const table = new tableEditor.TableEditor(editor);
        table.addNewLine();
    }
}

export async function key_tab() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    if (util.tableIsSelected(editor)) {
        const table = new tableEditor.TableEditor(editor);
        table.selectionChange('right');
    } else if (util.listIsSelected(editor)) {
        //await listEditor.indentAction("curLine", editor);
        //completionItemProvider.setListCompletionTrigger(true);
        //listEditor.moveSelectionPositionForCompletion();
        vscode.commands.executeCommand('editor.action.triggerSuggest');
    } else if (util.listExistsOneLineAbove(editor)) {
        //await listEditor.indentAction("aboveLine", editor);
        //completionItemProvider.setListCompletionTrigger(true);
        //listEditor.moveSelectionPositionForCompletion();
        vscode.commands.executeCommand('editor.action.triggerSuggest');
    } else {
        vscode.commands.executeCommand('tab');
    }
}

export async function key_shift_tab() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    if (util.tableIsSelected(editor)) {
        const table = new tableEditor.TableEditor(editor);
        table.selectionChange('left');
    } else if (util.listIsSelected(editor)) {
        //listEditor.outdentAction(editor);
    } else {
        vscode.commands.executeCommand('outdent');
    }
}

// Normal line feed [通常の改行]
async function _addNewLine() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    const editOptions = {undoStopBefore: false, undoStopAfter: false};
    await editor.edit(editBuilder => {
        const curPosition = editor.selection.end;
        editBuilder.insert(curPosition, '\n');
    }, editOptions);
}
