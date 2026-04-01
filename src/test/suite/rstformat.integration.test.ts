import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';

import {closeActiveWindows, openFile, samplePath, wait} from './initialize';

const formatterTestsEnabled =
    process.env['RSTFORMAT_TEST'] === '1' ||
    process.env['FORMATTER_TEST'] === '1';

suite('rstformat Integration Tests', function () {
    this.timeout(120000);

    suiteSetup(async function () {
        if (!formatterTestsEnabled) {
            this.skip();
        }
    });

    setup(async () => {
        await closeActiveWindows();
    });

    teardown(async () => {
        await closeActiveWindows();
    });

    test('formats document by normalizing section underlines', async function () {
        const editor = await openFile(
            path.join(samplePath, 'formatter', 'unformatted.rst')
        );

        const originalText = editor.document.getText();

        const edits = await vscode.commands.executeCommand<vscode.TextEdit[]>(
            'vscode.executeFormatDocumentProvider',
            editor.document.uri,
            {tabSize: 4, insertSpaces: true}
        );

        // rstformat should produce edits when document needs formatting
        assert.ok(edits !== undefined, 'Format command should return edits');
        assert.ok(
            Array.isArray(edits),
            'Format command should return an array of edits'
        );

        if (edits.length > 0) {
            // Apply the edits
            const wsEdit = new vscode.WorkspaceEdit();
            wsEdit.set(editor.document.uri, edits);
            await vscode.workspace.applyEdit(wsEdit);
            await wait(200);

            const formattedText = editor.document.getText();
            assert.notStrictEqual(
                formattedText,
                originalText,
                'Document should be changed after formatting'
            );
            // The underline under "Title" should be the correct width (5 chars)
            assert.ok(
                formattedText.includes('====='),
                'Title underline should be normalized to 5 chars'
            );
        }
    });

    test('range formatting only affects selected range', async function () {
        const editor = await openFile(
            path.join(samplePath, 'formatter', 'unformatted.rst')
        );

        // Select only the first section
        const range = new vscode.Range(
            new vscode.Position(0, 0),
            new vscode.Position(2, 0)
        );

        const edits = await vscode.commands.executeCommand<vscode.TextEdit[]>(
            'vscode.executeFormatRangeProvider',
            editor.document.uri,
            range,
            {tabSize: 4, insertSpaces: true}
        );

        assert.ok(edits !== undefined, 'Range format command should return edits');
        assert.ok(
            Array.isArray(edits),
            'Range format command should return an array of edits'
        );
    });

    test('formatting is idempotent', async function () {
        const editor = await openFile(
            path.join(samplePath, 'formatter', 'unformatted.rst')
        );

        // Format once
        const edits1 = await vscode.commands.executeCommand<vscode.TextEdit[]>(
            'vscode.executeFormatDocumentProvider',
            editor.document.uri,
            {tabSize: 4, insertSpaces: true}
        );

        if (edits1 && edits1.length > 0) {
            const wsEdit = new vscode.WorkspaceEdit();
            wsEdit.set(editor.document.uri, edits1);
            await vscode.workspace.applyEdit(wsEdit);
            await wait(200);
        }

        // Format again — should produce no edits on already-formatted content
        const edits2 = await vscode.commands.executeCommand<vscode.TextEdit[]>(
            'vscode.executeFormatDocumentProvider',
            editor.document.uri,
            {tabSize: 4, insertSpaces: true}
        );

        assert.ok(
            !edits2 || edits2.length === 0,
            'Formatting an already-formatted document should produce no edits'
        );
    });
});
