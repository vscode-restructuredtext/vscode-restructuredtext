// ============================================================
// Copyright (c) 2021 Tatsuya Nakamori. All rights reserved.
// See LICENSE in the project root for license information.
// ============================================================
import * as vscode from 'vscode';
import container from '../inversify.config';
import {TYPES} from '../types';
import {Configuration} from '../util/configuration';
import * as util from './util';

interface CellPosition {
    line: number;
    column: number;
    row: number;
}

export class TableEditor {
    editor: vscode.TextEditor;
    tableRange: vscode.Range;
    tableLineNumbers: number[] | undefined;
    selectedCellPosition: CellPosition;

    constructor(editor: vscode.TextEditor) {
        this.editor = editor;

        this.tableLineNumbers = util.tableIsSelected(this.editor);
        this.tableRange = this._tableRange();

        this.selectedCellPosition = this.selectedCellColumn();
    }

    public async reformat() {
        const configuration = container.get<Configuration>(TYPES.Configuration);
        if (configuration.getTableEditorReformatDisabled()) {
            return;
        }
        this.tableLineNumbers = util.tableIsSelected(this.editor);

        const cellContents: string[][] = this._getCellContents();
        const hasHeader: boolean = this._hasHeader();
        const insertText = this._generateTableString(cellContents, hasHeader);

        const editOptions = {undoStopBefore: false, undoStopAfter: false};
        await this.editor.edit(editBuilder => {
            const tableRange = this._tableRange();
            editBuilder.replace(tableRange, insertText);
        }, editOptions);
    }

    public async createEmptyGrid() {
        let [row, column] = util.tableSizeIsSelected(this.editor);

        const inputResult = await vscode.window.showQuickPick([
            'With Header',
            'Without Header',
        ]);
        if (!inputResult) {
            return;
        }
        const header = inputResult === 'With Header';

        if (header) {
            row += 1;
        }

        const contentsLine = new Array(column).fill(''); // ""-filled array: ["", "", "".....]
        const cellContents = new Array(row).fill(contentsLine); // []-filled array: [["", ""], ["", ""], ["", ""].....]
        const insertText = this._generateTableString(cellContents, header);

        const curLine = this.editor.selection.start.line;
        const curLineRange = this.editor.document.lineAt(curLine).range;

        const editOptions = {undoStopBefore: false, undoStopAfter: false};
        await this.editor.edit(editBuilder => {
            editBuilder.replace(curLineRange, insertText);
        }, editOptions);

        const newPos = new vscode.Position(curLine + 1, 2);
        this.editor.selection = new vscode.Selection(newPos, newPos);
    }

    public async dataToTable() {
        if (this.editor.selection.isEmpty) {
            return;
        }

        const selection = this.editor.selection;
        const startPos = new vscode.Position(selection.start.line, 0);
        const endLine = selection.end.line;
        const endLastChar =
            this.editor.document.lineAt(endLine).range.end.character;
        const endPos = new vscode.Position(endLine, endLastChar);

        const data = this.editor.document.getText(
            new vscode.Range(startPos, endPos)
        );
        const dataLines = data.split(/\r\n|\r|\n/);

        // First, we will parse the selected csv format string.
        const cellContents: string[][] = [];
        for (let i = 0; i < dataLines.length; i++) {
            const dataLine = dataLines[i];
            const contents = dataLine.split(',');
            cellContents.push([]);

            for (let j = 0; j < contents.length; j++) {
                let content = contents[j];
                content = content.trim();
                content = content.replace(/(\s)\s*/g, '$1');
                cellContents[i].push(content);
            }
        }

        const inputResult = await vscode.window.showQuickPick([
            'With Header',
            'Without Header',
        ]);
        if (!inputResult) {
            return;
        }
        const header = inputResult == 'With Header';

        const insertText = this._generateTableString(cellContents, header);

        const editOptions = {undoStopBefore: false, undoStopAfter: false};
        await this.editor.edit(editBuilder => {
            editBuilder.replace(new vscode.Range(startPos, endPos), insertText);
        }, editOptions);

        const newPos = new vscode.Position(startPos.line + 1, 2);
        this.editor.selection = new vscode.Selection(newPos, newPos);
    }

    private _generateTableString(
        cellContents: string[][],
        header: boolean
    ): string {
        // Record the maximum number of characters in each column in an array (At least three.)
        const cellStrLengthList: number[] = [];
        for (let i = 0; i < cellContents.length; i++) {
            for (let j = 0; j < cellContents[i].length; j++) {
                if (j > cellStrLengthList.length - 1) {
                    cellStrLengthList.push(3);
                }

                const content = cellContents[i][j];
                const rows = content.split(/\r\n|\r|\n/);
                for (let k = 0; k < rows.length; k++) {
                    const row = rows[k];

                    let strCount = util.countTextWidth(row);
                    if (rows.length > 1) {
                        strCount -= 1;
                    }
                    cellStrLengthList[j] = Math.max(
                        cellStrLengthList[j],
                        strCount
                    );
                }
            }
        }

        // GenerateGrid
        let gridRow = '';
        let headerRow = '';
        for (let i = 0; i < cellStrLengthList.length; i++) {
            const width = cellStrLengthList[i] + 2;
            gridRow += `+${'-'.repeat(width)}`; // +-----
            headerRow += `+${'='.repeat(width)}`; // +=====
        }
        gridRow += '+'; // +-----+----+---+
        headerRow += '+'; // +=====+====+===+

        const insertTextLines: string[] = [];
        for (let i = 0; i < cellContents.length; i++) {
            if (i == 0) {
                insertTextLines.push(gridRow); // +-----+----+---+  // roof
            }

            const multiLineCell: string[][] = [];
            const columnContents = cellContents[i];
            for (
                let columnIndex = 0;
                columnIndex < columnContents.length;
                columnIndex++
            ) {
                const cellText = columnContents[columnIndex];
                const cellTextSplit = cellText.split(/\r\n|\r|\n/);

                if (columnIndex == 0) {
                    for (let j = 0; j < cellTextSplit.length; j++) {
                        multiLineCell.push([]); // []-filled array:[[], [].....]
                    }
                }

                for (
                    let lineIndex = 0;
                    lineIndex < cellTextSplit.length;
                    lineIndex++
                ) {
                    const contentLine = cellTextSplit[lineIndex];
                    multiLineCell[lineIndex].push(contentLine);
                }
            }

            for (
                let lineIndex = 0;
                lineIndex < multiLineCell.length;
                lineIndex++
            ) {
                let cellRow = '';
                const lineTextList = multiLineCell[lineIndex];

                for (
                    let columnIndex = 0;
                    columnIndex < cellStrLengthList.length;
                    columnIndex++
                ) {
                    const textMaxWidth = cellStrLengthList[columnIndex];
                    const content = lineTextList[columnIndex];

                    if (columnIndex < lineTextList.length) {
                        const strCount = util.countTextWidth(content);
                        const missingSpaces = `${' '.repeat(
                            textMaxWidth - strCount + 1
                        )}`;

                        if (multiLineCell.length > 1) {
                            cellRow += `|${content}${missingSpaces} `; // || ABC
                        } else {
                            cellRow += `| ${content}${missingSpaces}`; // | ABC
                        }
                    } else {
                        cellRow += `|${' '.repeat(textMaxWidth + 2)}`; // |.....
                    }
                }
                cellRow += '|'; // | ABC | DE | F |
                insertTextLines.push(cellRow); // | ABC | DE | F |
            }

            if (i == 0 && header) {
                insertTextLines.push(headerRow); // +=====+====+===+
            } else {
                insertTextLines.push(gridRow); // +-----+----+---+
            }
        }

        return insertTextLines.join('\n');
    }

    private _hasHeader(): boolean {
        if (!this.tableLineNumbers) {
            return false;
        }

        // Various regular expressions
        const regGridHeaderLine = /^\+=(=|\+)+=\+$/;

        for (let i = 0; i < this.tableLineNumbers.length; i++) {
            const tableLine = this.tableLineNumbers[i];

            let lineText = this.editor.document.lineAt(tableLine).text;
            lineText = lineText.trim();

            const gridHeaderLineMatch = regGridHeaderLine.exec(lineText);
            if (gridHeaderLineMatch) {
                return true;
            }
        }

        return false;
    }

    private _getCellContents(): string[][] {
        if (!this.tableLineNumbers) {
            return [];
        }

        // Various regular expressions
        const regContentsLine = /^(\+)?\|.+\|(\+)?$/;
        const regCellContents =
            /(?<=\|(\+|-)?([<>^v])*) (?<content>([^|]|(\*\|\*)|(\`\|\`))*?) (?=([<>^v])*(\+|-)?\|)/g;

        let curLineKind: 'contents' | undefined;
        const cellContents: string[][] = [];
        for (let i = 0; i < this.tableLineNumbers.length; i++) {
            const tableLine = this.tableLineNumbers[i];

            let lineText = this.editor.document.lineAt(tableLine).text;
            lineText = lineText.trim();

            const contentsLine = regContentsLine.exec(lineText);
            if (!contentsLine) {
                curLineKind = undefined;
                continue;
            }

            if (curLineKind != 'contents') {
                cellContents.push([]);
            }

            let columnIndex = 0;
            var match;
            while ((match = regCellContents.exec(lineText))) {
                if (!match?.groups) {
                    continue;
                }

                let content = match.groups['content'];
                content = content.trim();
                content = content.replace(/(\s)\s*/g, '$1');

                if (curLineKind != 'contents') {
                    cellContents[cellContents.length - 1].push(content);
                } else {
                    let prevContent =
                        cellContents[cellContents.length - 1][columnIndex];

                    if (!prevContent) {
                        prevContent = '| ';
                    } else if (!prevContent.startsWith('|')) {
                        prevContent = `| ${prevContent}`;
                    }
                    cellContents[cellContents.length - 1][
                        columnIndex
                    ] = `${prevContent}\n| ${content}`;
                    columnIndex += 1;
                }
            }
            curLineKind = 'contents';
        }

        return cellContents;
    }

    private _tableRange(): vscode.Range {
        if (this.tableLineNumbers) {
            const startPos = new vscode.Position(this.tableLineNumbers[0], 0);
            const endLine =
                this.tableLineNumbers[this.tableLineNumbers.length - 1];
            const endLastChar =
                this.editor.document.lineAt(endLine).range.end.character;
            const endPos = new vscode.Position(endLine, endLastChar);
            return new vscode.Range(startPos, endPos);
        } else {
            const startPos = new vscode.Position(0, 0);
            const endPos = new vscode.Position(0, 0);
            return new vscode.Range(startPos, endPos);
        }
    }

    public isSelectedFirstGrid(): boolean {
        const curLine = this.editor.selection.start.line;

        const tableRange = this._tableRange();
        const tableStartLine = tableRange.start.line;

        return curLine == tableStartLine;
    }

    public isSelectedLastGrid(): boolean {
        const curLine = this.editor.selection.end.line;

        const tableRange = this._tableRange();
        const tableLastLine = tableRange.end.line;

        return curLine == tableLastLine;
    }

    public selectedCellColumn(): CellPosition {
        const curLine = this.editor.selection.start.line;
        const curChar = this.editor.selection.start.character;
        const lineText = this.editor.document.lineAt(curLine).text;

        const regContentsLine = /^\+?\|.+\|\+?$/;
        const regCellContents =
            /(?<=\|)(?<cell>(\+|-)?([<>v^])* .*? ([<>v^])*(\+|-)?)(?=\|)/g;

        let column = -1;
        let row = -1;
        if (!regContentsLine.exec(lineText) || !this.tableLineNumbers) {
            const selectedCell: CellPosition = {
                line: curLine,
                column: column,
                row: row,
            };
            return selectedCell;
        }

        // Column Index
        let match;
        while ((match = regCellContents.exec(lineText))) {
            if (!match?.groups) {
                continue;
            }
            column += 1;

            const matchIndex = match.index;
            const cellText = match.groups['cell'];
            const lastIndex = matchIndex + cellText.length;

            if (curChar <= lastIndex) {
                break;
            }
        }

        // Row Index
        let curLineKind: 'contents' | undefined;
        for (let i = 0; i < this.tableLineNumbers.length; i++) {
            const lineNumber = this.tableLineNumbers[i];
            const lineText = this.editor.document.lineAt(lineNumber).text;

            if (!regContentsLine.exec(lineText)) {
                curLineKind = undefined;
                continue;
            }

            if (!curLineKind) {
                row += 1;
                curLineKind = 'contents';
            }

            if (lineNumber >= curLine) {
                break;
            }
        }

        const selectedCell: CellPosition = {
            line: curLine,
            column: column,
            row: row,
        };

        return selectedCell;
    }

    public selectCellContent(
        cellPosition: CellPosition,
        offset?: 'top' | 'buttom' | 'left' | 'right',
        offsetType?: 'cellIndex' | 'lineNumber'
    ) {
        if (!this.tableLineNumbers) {
            return;
        }

        let lineNumber = cellPosition.line;
        let rowIndex = cellPosition.row;
        let columnIndex = cellPosition.column;
        if (rowIndex == -1) {
            rowIndex = 0;
        }
        if (columnIndex == -1) {
            columnIndex = 0;
        }

        let curLine = lineNumber;
        if (offset == 'top') {
            curLine -= 1;
            rowIndex -= 1;
        } else if (offset == 'buttom') {
            curLine += 1;
            rowIndex += 1;
        } else if (offset == 'right') {
            columnIndex += 1;
        } else if (offset == 'left') {
            columnIndex -= 1;
        }

        // Calc Row Number
        let lineText = '';
        const regContentsLine = /^\|.+\|$/;

        if (offsetType == 'cellIndex') {
            let curRowIndex = -1;
            let curLineKind: 'contents' | undefined;
            for (let i = 0; i < this.tableLineNumbers.length; i++) {
                const curLineNumber = this.tableLineNumbers[i];
                const lineText =
                    this.editor.document.lineAt(curLineNumber).text;

                if (!regContentsLine.exec(lineText)) {
                    curLineKind = undefined;
                    continue;
                }

                if (!curLineKind) {
                    curRowIndex += 1;
                    curLineKind = 'contents';
                }

                if (curRowIndex >= rowIndex) {
                    lineNumber = curLineNumber;
                    break;
                }
            }
            lineText = this.editor.document.lineAt(lineNumber).text;
        } else {
            let matchedContentsLine = false;
            if (offset == 'top' || offset == 'buttom') {
                while (this.tableLineNumbers.includes(curLine)) {
                    lineText = this.editor.document.lineAt(curLine).text;

                    if (!regContentsLine.exec(lineText)) {
                        if (offset == 'top') {
                            curLine -= 1;
                        } else if (offset == 'buttom') {
                            curLine += 1;
                        }
                    } else {
                        matchedContentsLine = true;
                        lineNumber = curLine;
                        break;
                    }
                }
            }

            if (!matchedContentsLine) {
                lineText = this.editor.document.lineAt(lineNumber).text;
            }
        }

        // Get Column Index (match.index)
        const regCellContents =
            /(?<=\|)(?<cell> ([^|]|(\*\|\*)|(\`\|\`))* )(?=\|)/g;

        let curColumn = 0;
        let match;
        while ((match = regCellContents.exec(lineText))) {
            if (curColumn >= columnIndex) {
                break;
            }
            curColumn += 1;
        }

        if (!match?.groups) {
            return;
        }
        const matchIndex = match.index;
        const cellText = match.groups['cell'];

        // Index of characters to select
        const regAllSpaces = /^(\s+)$/;
        const regWord = /^(\s*)(.*?)\s*$/;
        const allSpaceMatch = regAllSpaces.exec(cellText);
        const wordMatch = regWord.exec(cellText);

        let wordFirstIndex = 0;
        let wordLastIndex = 0;
        if (allSpaceMatch) {
            wordFirstIndex = matchIndex + 1;
            wordLastIndex = wordFirstIndex;
        } else if (wordMatch) {
            const cellSpeces = wordMatch[1];
            const cellWordText = wordMatch[2];
            wordFirstIndex = matchIndex + wordMatch.index + cellSpeces.length;
            wordLastIndex = wordFirstIndex + cellWordText.length;
        }

        // Range
        const newPosStart = new vscode.Position(lineNumber, wordFirstIndex);
        const newPosEnd = new vscode.Position(lineNumber, wordLastIndex);
        this.editor.selection = new vscode.Selection(newPosStart, newPosEnd);
    }

    public async selectionChange(moveTo: 'top' | 'buttom' | 'right' | 'left') {
        await this.reformat();
        this.selectCellContent(this.selectedCellPosition, moveTo);
    }

    public async addNewLine() {
        const curLine = this.editor.selection.start.line;
        const curTextLine = this.editor.document.lineAt(curLine);
        const lineText = curTextLine.text;
        const lineEndPosition = curTextLine.range.end;

        const regCellContents = /(?<=\|)( .*? )(?=\|)/g;
        const emptyRow = lineText.replace(regCellContents, '   ');
        const insertText = `\n${emptyRow}`;

        const editOptions = {undoStopBefore: false, undoStopAfter: false};
        await this.editor.edit(editBuilder => {
            editBuilder.replace(lineEndPosition, insertText);
        }, editOptions);

        await this.reformat();

        this.selectCellContent(this.selectedCellPosition, 'buttom');
    }

    public async addRow() {
        if (!this.tableLineNumbers) {
            return;
        }

        const curLine = this.editor.selection.start.line;
        let startIndex = this.tableLineNumbers.indexOf(curLine);
        if (startIndex == -1) {
            return;
        } else if (startIndex == 0) {
            startIndex += 1;
        }

        const regGridLine = /^\+(-|=)(\1|\+)+\1\+$/;
        let insertRowLineNumber = startIndex;
        for (let i = startIndex; i < this.tableLineNumbers.length; i++) {
            const tableLine = this.tableLineNumbers[i];
            const lineText = this.editor.document.lineAt(tableLine).text;

            const gridLineMatch = regGridLine.exec(lineText);
            if (gridLineMatch) {
                insertRowLineNumber = this.tableLineNumbers[i];
                break;
            }
        }

        // Get information about the content
        const cellContents: string[][] = this._getCellContents();
        const hasHeader: boolean = this._hasHeader();

        const insertRowIndex = this.selectedCellPosition.row + 1;
        cellContents.splice(insertRowIndex, 0, ['']);

        // Updating a table
        const editOptions = {undoStopBefore: false, undoStopAfter: false};
        await this.editor.edit(editBuilder => {
            const insertText = this._generateTableString(
                cellContents,
                hasHeader
            );
            const tableRange = this._tableRange();
            editBuilder.replace(tableRange, insertText);
        }, editOptions);

        // Select a cell
        this.tableLineNumbers = util.tableIsSelected(this.editor);
        this.selectedCellPosition.column = 0;
        this.selectedCellPosition.line = insertRowLineNumber;
        this.selectCellContent(
            this.selectedCellPosition,
            'buttom',
            'cellIndex'
        );
    }

    public async removeRow() {
        await this.reformat();
        this.selectCellContent(this.selectedCellPosition);
    }

    public async moveRow(moveTo: 'top' | 'bottom') {
        if (!this.tableLineNumbers) {
            return;
        }

        const numOfTimesToMove = this._getNumberOfTimesToMove(moveTo);

        // Get information about the content
        const cellContents: string[][] = this._getCellContents();
        const hasHeader: boolean = this._hasHeader();

        // Rowの入れ替え
        const row_from = this.selectedCellPosition.row;
        let row_to = row_from + numOfTimesToMove;
        if (row_to < 0) {
            row_to = 0;
        } else if (row_to > cellContents.length - 1) {
            row_to = cellContents.length - 1;
        }

        const moveRowContents = cellContents[row_from];
        cellContents.splice(row_from, 1); // 要素(行)を削除
        cellContents.splice(row_to, 0, moveRowContents); // 要素(行)を追加

        // Updating a table
        const editOptions = {undoStopBefore: false, undoStopAfter: false};
        await this.editor.edit(editBuilder => {
            const insertText = this._generateTableString(
                cellContents,
                hasHeader
            );
            const tableRange = this._tableRange();
            editBuilder.replace(tableRange, insertText);
        }, editOptions);

        // Select a cell
        this.selectedCellPosition.row = row_to;
        this.selectCellContent(this.selectedCellPosition);
    }

    public async addColumn() {
        if (!this.tableLineNumbers) {
            return;
        }

        // Locate the operator.
        const addLastColumn = util.isSelectingLastChara();

        const curLine = this.editor.selection.start.line;
        const curLineText = this.editor.document.lineAt(curLine).text;
        const regContents = /(?<=\|)(\+?)( .*? )(\+?)(?=\|)/g;
        let match;
        let afterOperator;
        while ((match = regContents.exec(curLineText))) {
            if (match[3]) {
                afterOperator = match[3];
                break;
            }
        }

        // Get information about the content
        const cellContents: string[][] = this._getCellContents();
        const hasHeader: boolean = this._hasHeader();

        // Make sure that each line has a newline.
        const newLineCount: number[] = [];
        for (var i = 0; i < cellContents.length; i++) {
            newLineCount.push(0);

            const rowContents = cellContents[i];
            for (let j = 0; j < rowContents.length; j++) {
                const cellContent = rowContents[j];
                const lineCount = cellContent.split(/\r\n|\r|\n/).length;
                newLineCount[i] = Math.max(newLineCount[i], lineCount);
            }
        }

        // Add a column to each row.
        let insertColumnIndex = this.selectedCellPosition.column;
        if (afterOperator || addLastColumn) {
            insertColumnIndex += 1;
        }
        for (var i = 0; i < cellContents.length; i++) {
            const rowContents = cellContents[i];
            if (newLineCount[i] > 1) {
                rowContents.splice(
                    insertColumnIndex,
                    0,
                    `${'\n'.repeat(newLineCount[i] - 1)}`
                ); // 要素を追加
            } else {
                rowContents.splice(insertColumnIndex, 0, ''); // 要素を追加
            }
        }

        // Updating a table
        const editOptions = {undoStopBefore: false, undoStopAfter: false};
        await this.editor.edit(editBuilder => {
            const insertText = this._generateTableString(
                cellContents,
                hasHeader
            );
            const tableRange = this._tableRange();

            editBuilder.replace(tableRange, insertText);
        }, editOptions);

        // Select a cell
        if (curLineText.startsWith('+|')) {
            this.selectedCellPosition.column = 0;
        } else if (afterOperator || addLastColumn) {
            this.selectedCellPosition.column += 1;
        }
        this.selectCellContent(this.selectedCellPosition);
    }

    public async removeColumn() {
        if (!this.tableLineNumbers) {
            return;
        }

        // Get information about the content
        const cellContents: string[][] = this._getCellContents();
        const hasHeader: boolean = this._hasHeader();

        const delColumnIndex = this.selectedCellPosition.column;
        for (let i = 0; i < cellContents.length; i++) {
            const rowContents = cellContents[i];
            rowContents.splice(delColumnIndex, 1); // 要素を削除
        }

        // Updating a table
        const editOptions = {undoStopBefore: false, undoStopAfter: false};
        await this.editor.edit(editBuilder => {
            const insertText = this._generateTableString(
                cellContents,
                hasHeader
            );
            const tableRange = this._tableRange();

            editBuilder.replace(tableRange, insertText);
        }, editOptions);

        // Select a cell
        const curColumn = this.selectedCellPosition.column;
        if (curColumn > 0) {
            this.selectedCellPosition.column -= 1;
        } else {
            this.selectedCellPosition.column = 0;
        }
        this.selectCellContent(this.selectedCellPosition);
    }

    public async moveColumn(moveTo: 'right' | 'left') {
        if (!this.tableLineNumbers) {
            return;
        }

        const numOfTimesToMove = this._getNumberOfTimesToMove(moveTo);

        // Get information about the content
        const cellContents: string[][] = this._getCellContents();
        const hasHeader: boolean = this._hasHeader();

        // Columnの入れ替え
        const column_from = this.selectedCellPosition.column;
        let column_to = column_from + numOfTimesToMove;
        if (column_to < 0) {
            column_to = 0;
        } else if (column_to > cellContents[0].length - 1) {
            column_to = cellContents[0].length - 1;
        }

        for (let i = 0; i < cellContents.length; i++) {
            const rowContents = cellContents[i];
            const moveColumnContent = rowContents[column_from];
            rowContents.splice(column_from, 1); // 要素を削除
            rowContents.splice(column_to, 0, moveColumnContent); // 要素を追加
        }

        // Updating a table
        const editOptions = {undoStopBefore: false, undoStopAfter: false};
        await this.editor.edit(editBuilder => {
            const insertText = this._generateTableString(
                cellContents,
                hasHeader
            );
            const tableRange = this._tableRange();
            editBuilder.replace(tableRange, insertText);
        }, editOptions);

        // Select a cell
        this.selectedCellPosition.column = column_to;
        this.selectCellContent(this.selectedCellPosition);
    }

    private _getNumberOfTimesToMove(
        moveTo: 'top' | 'bottom' | 'right' | 'left'
    ): number {
        let checkChar = '';
        if (moveTo == 'top') {
            checkChar = '^';
        } else if (moveTo == 'bottom') {
            checkChar = 'v';
        } else if (moveTo == 'right') {
            checkChar = '>';
        } else if (moveTo == 'left') {
            checkChar = '<';
        }

        const curLine = this.editor.selection.start.line;
        const curLineCharList = this.editor.document
            .lineAt(curLine)
            .text.split('');

        let curChar = this.editor.selection.start.character - 1;
        let numOfTimesToMove = 0;
        while (curChar >= 0) {
            if (checkChar != curLineCharList[curChar]) {
                break;
            }
            numOfTimesToMove += 1;
            curChar -= 1;
        }

        if (moveTo == 'right' || moveTo == 'bottom') {
            return numOfTimesToMove;
        } else {
            return -numOfTimesToMove;
        }
    }
}
