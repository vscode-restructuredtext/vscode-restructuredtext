import * as vscode from 'vscode';

async function waitFor(
    predicate: () => boolean,
    timeout = 30000
): Promise<void> {
    const start = Date.now();
    while (!predicate()) {
        if (Date.now() - start > timeout) {
            throw new Error('Timed out waiting for a condition');
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

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

        test('formats CJK text with the bundled Python runtime', async () => {
            const document = await vscode.workspace.openTextDocument({
                content: '标题\n==\n\n正文\n',
                language: 'restructuredtext',
            });
            await vscode.window.showTextDocument(document);

            await vscode.commands.executeCommand(
                'editor.action.formatDocument'
            );

            check(
                document.getText() === '标题\n====\n\n正文\n',
                `unexpected formatted text: ${JSON.stringify(
                    document.getText()
                )}`
            );
        });

        test('publishes doc8 diagnostics for open documents', async () => {
            const configuration = vscode.workspace.getConfiguration(
                'restructuredtext'
            );
            const previous = configuration.inspect('linter.run')?.globalValue;
            await configuration.update(
                'linter.run',
                'onType',
                vscode.ConfigurationTarget.Global
            );

            try {
                const text =
                    'Title\n=====\n\n' + 'word '.repeat(25) + '\n';
                const document = await vscode.workspace.openTextDocument({
                    content: text,
                    language: 'restructuredtext',
                });
                const editor = await vscode.window.showTextDocument(document);
                await editor.edit(edit =>
                    edit.insert(new vscode.Position(0, 0), ' ')
                );
                await editor.edit(edit =>
                    edit.delete(new vscode.Range(0, 0, 0, 1))
                );

                await waitFor(() =>
                    vscode.languages
                        .getDiagnostics(document.uri)
                        .some(diagnostic => diagnostic.source === 'doc8')
                );

                const diagnostics = vscode.languages
                    .getDiagnostics(document.uri)
                    .filter(diagnostic => diagnostic.source === 'doc8');
                check(
                    diagnostics.some(diagnostic =>
                        String(diagnostic.code).includes('D001')
                    ),
                    `doc8 diagnostics did not contain D001: ${JSON.stringify(
                        diagnostics.map(diagnostic => diagnostic.code)
                    )}`
                );
                check(
                    !vscode.languages
                        .getDiagnostics(document.uri)
                        .some(diagnostic => diagnostic.source === 'rst-lint'),
                    'rst-lint should not duplicate doc8 diagnostics'
                );
            } finally {
                await configuration.update(
                    'linter.run',
                    previous,
                    vscode.ConfigurationTarget.Global
                );
            }
        });

        test('runs rst-lint through the bundled Python runtime', async () => {
            const extension = vscode.extensions.getExtension(
                'lextudio.restructuredtext'
            );
            const api = extension?.exports as
                | {
                      lintForTests?: (
                          tool: string,
                          text: string,
                          args?: string[]
                      ) => Promise<string>;
                  }
                | undefined;

            const warning = await api?.lintForTests?.(
                'rst-lint',
                'Title\n====\n'
            );
            check(
                typeof warning === 'string' &&
                    warning.includes('Title underline too short'),
                `rst-lint did not report the warning: ${JSON.stringify(
                    warning
                )}`
            );

            const errorsOnly = await api?.lintForTests?.(
                'rst-lint',
                'Title\n====\n',
                ['--level', 'error']
            );
            check(
                typeof errorsOnly === 'string' &&
                    !errorsOnly.includes('Title underline too short'),
                `rst-lint ignored --level error: ${JSON.stringify(errorsOnly)}`
            );
        });

        test('runs rstcheck through the bundled Python runtime', async () => {
            const extension = vscode.extensions.getExtension(
                'lextudio.restructuredtext'
            );
            const api = extension?.exports as
                | {
                      lintForTests?: (
                          tool: string,
                          text: string,
                          args?: string[]
                      ) => Promise<string>;
                  }
                | undefined;

            const output = await api?.lintForTests?.(
                'rstcheck',
                'Title\n=====\n\n.. unknown::\n'
            );

            check(
                typeof output === 'string' &&
                    output.includes('Unknown directive'),
                `rstcheck did not report the error: ${JSON.stringify(output)}`
            );
        });

        test('runs doc8 through the bundled Python runtime', async () => {
            const extension = vscode.extensions.getExtension(
                'lextudio.restructuredtext'
            );
            const api = extension?.exports as
                | {
                      lintForTests?: (
                          tool: string,
                          text: string,
                          args?: string[]
                      ) => Promise<string>;
                  }
                | undefined;
            const text = 'Title\n=====\n\n' + 'word '.repeat(25) + '\n';

            const output = await api?.lintForTests?.('doc8', text);

            check(
                typeof output === 'string' && output.includes('D001'),
                `doc8 did not report D001: ${JSON.stringify(output)}`
            );
        });
    });
}
