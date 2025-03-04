/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import {Command} from '../util/commandManager';

export class MoveCursorToPositionCommand implements Command {
    public readonly id = 'restructuredtext.moveCursorToPosition';

    public execute(line: number, character: number) {
        if (!vscode.window.activeTextEditor) {
            return;
        }

        const position = new vscode.Position(line, character);
        const selection = new vscode.Selection(position, position);
        vscode.window.activeTextEditor.selection = selection;
        vscode.window.activeTextEditor.revealRange(
            selection,
            vscode.TextEditorRevealType.InCenter
        );
    }
}
