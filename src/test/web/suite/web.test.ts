import * as vscode from 'vscode';

function check(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(message);
    }
}

export function defineTests(): void {
    suite('Web Extension Integration Tests', () => {
        test('activates in web mode and registers editor commands', async () => {
            const extension = vscode.extensions.getExtension(
                'lextudio.restructuredtext'
            );
            check(extension !== undefined, 'extension is not installed');

            await extension?.activate();

            check(
                vscode.env.uiKind === vscode.UIKind.Web,
                'extension host is not running as VS Code Web'
            );

            const commands = await vscode.commands.getCommands(true);
            check(
                commands.includes(
                    'restructuredtext.features.underline.underline'
                ),
                'underline command is not registered'
            );
            check(
                commands.includes('resttext.table.createGrid'),
                'table command is not registered'
            );

            const api = extension?.exports as
                | {isFormatterRegistered?: () => boolean}
                | undefined;
            check(
                api?.isFormatterRegistered?.() === true,
                'formatter provider is not registered in web mode'
            );
        });

        test('underlines a title', async () => {
            const document = await vscode.workspace.openTextDocument({
                content: 'hello',
                language: 'restructuredtext',
            });
            const editor = await vscode.window.showTextDocument(document);
            const position = new vscode.Position(0, 5);
            editor.selection = new vscode.Selection(position, position);

            await vscode.commands.executeCommand(
                'restructuredtext.features.underline.underline'
            );

            check(
                document.getText() === 'hello\n=====',
                `unexpected underline result: ${JSON.stringify(
                    document.getText()
                )}`
            );
        });

        test('formatter degrades gracefully without rstformat', async () => {
            const document = await vscode.workspace.openTextDocument({
                content: 'Title\n==\n',
                language: 'restructuredtext',
            });
            await vscode.window.showTextDocument(document);
            check(
                document.languageId === 'restructuredtext',
                `unexpected language id: ${document.languageId}`
            );

            const original = document.getText();
            await vscode.commands.executeCommand(
                'editor.action.formatDocument'
            );

            check(
                document.getText() === original,
                'formatter should not change documents in the browser'
            );
        });
    });
}
