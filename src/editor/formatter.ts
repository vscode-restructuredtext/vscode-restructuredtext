import * as vscode from 'vscode';
import * as cp from 'child_process';

import {getRstformatEnv} from '../util/rstformatEnv';
import {getWebPythonService} from '../web/pythonService';

const DEFAULT_ADORNMENTS = '#*=-^"\'`:.~_+';
const DEFAULT_MAX_BLANK_LINES = 2;

interface FormatterSettings {
    adornments: string;
    insertFinalNewline: boolean;
    maxConsecutiveBlankLines: number;
    normalizeSectionSpacing: boolean;
    normalizeSectionUnderlines: boolean;
    trimTrailingWhitespace: boolean;
}

function getSettings(
    document: vscode.TextDocument,
    insertFinalNewline: boolean
): FormatterSettings {
    const configuration = vscode.workspace.getConfiguration(
        'restructuredtext',
        document.uri
    );

    return {
        adornments:
            configuration.get<string>('editor.sectionEditor.adornments') ??
            DEFAULT_ADORNMENTS,
        insertFinalNewline,
        maxConsecutiveBlankLines: Math.max(
            0,
            configuration.get<number>(
                'formatter.maxConsecutiveBlankLines',
                DEFAULT_MAX_BLANK_LINES
            )
        ),
        normalizeSectionSpacing: configuration.get<boolean>(
            'formatter.normalizeSectionSpacing',
            true
        ),
        normalizeSectionUnderlines: configuration.get<boolean>(
            'formatter.normalizeSectionUnderlines',
            true
        ),
        trimTrailingWhitespace: configuration.get<boolean>(
            'formatter.trimTrailingWhitespace',
            true
        ),
    };
}

function buildRstformatArgs(settings: FormatterSettings): string[] {
    const args: string[] = [];

    if (settings.adornments !== DEFAULT_ADORNMENTS) {
        args.push('--adornments', settings.adornments);
    }

    if (settings.maxConsecutiveBlankLines !== DEFAULT_MAX_BLANK_LINES) {
        args.push(
            '--max-consecutive-blank-lines',
            settings.maxConsecutiveBlankLines.toString()
        );
    }

    if (!settings.normalizeSectionSpacing) {
        args.push('--no-normalize-section-spacing');
    }

    if (!settings.normalizeSectionUnderlines) {
        args.push('--no-normalize-section-underlines');
    }

    if (!settings.trimTrailingWhitespace) {
        args.push('--no-trim-trailing-whitespace');
    }

    if (!settings.insertFinalNewline) {
        args.push('--no-insert-final-newline');
    }

    return args;
}

async function formatWithRstformat(
    text: string,
    settings: FormatterSettings
): Promise<string> {
    if (vscode.env.uiKind === vscode.UIKind.Web) {
        try {
            return await getWebPythonService().format(text, settings);
        } catch (error) {
            vscode.window.showErrorMessage(
                `reStructuredText formatter failed: ${
                    error instanceof Error ? error.message : String(error)
                }`
            );
            return text;
        }
    }

    return new Promise<string>(resolve => {
        try {
            const args = buildRstformatArgs(settings);

            if (typeof cp.spawn !== 'function') {
                vscode.window.showErrorMessage(
                    'rstformat is not available in this environment'
                );
                resolve(text);
                return;
            }

            const proc = cp.spawn('rstformat', args, {
                env: getRstformatEnv(),
            });
            let output = '';
            let errorOutput = '';

            // Decode incrementally so multi-byte characters split across
            // chunks are not corrupted.
            proc.stdout?.setEncoding('utf8');
            proc.stderr?.setEncoding('utf8');

            proc.stdout?.on('data', (data: string) => {
                output += data;
            });

            proc.stderr?.on('data', (data: string) => {
                errorOutput += data;
            });

            proc.on('error', error => {
                vscode.window.showErrorMessage(
                    `rstformat error: ${error.message}`
                );
                resolve(text);
            });

            proc.on('close', code => {
                if (code === 0) {
                    resolve(output);
                } else if (errorOutput) {
                    vscode.window.showErrorMessage(
                        `rstformat failed: ${errorOutput}`
                    );
                    resolve(text);
                } else {
                    resolve(text);
                }
            });

            proc.stdin?.write(text);
            proc.stdin?.end();
        } catch (error) {
            const errorMsg =
                error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(
                `rstformat formatting failed: ${errorMsg}`
            );
            resolve(text);
        }
    });
}

function fullDocumentRange(document: vscode.TextDocument): vscode.Range {
    const lastLine = Math.max(0, document.lineCount - 1);
    return new vscode.Range(
        new vscode.Position(0, 0),
        document.lineCount === 0
            ? new vscode.Position(0, 0)
            : document.lineAt(lastLine).range.end
    );
}

export class ReStructuredTextFormattingProvider
    implements
        vscode.DocumentFormattingEditProvider,
        vscode.DocumentRangeFormattingEditProvider
{
    async provideDocumentFormattingEdits(
        document: vscode.TextDocument
    ): Promise<vscode.TextEdit[]> {
        const formatted = await formatWithRstformat(
            document.getText(),
            getSettings(document, true)
        );
        if (formatted === document.getText()) {
            return [];
        }

        return [
            vscode.TextEdit.replace(fullDocumentRange(document), formatted),
        ];
    }

    async provideDocumentRangeFormattingEdits(
        document: vscode.TextDocument,
        range: vscode.Range
    ): Promise<vscode.TextEdit[]> {
        const formatted = await formatWithRstformat(
            document.getText(range),
            getSettings(document, false)
        );
        if (formatted === document.getText(range)) {
            return [];
        }

        return [vscode.TextEdit.replace(range, formatted)];
    }
}
