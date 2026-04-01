import * as vscode from 'vscode';
import {
    key_alt_enter,
    key_enter,
    key_shift_enter,
    key_shift_tab,
    key_tab,
} from './commands';

import {EditorCommands, VSCodeInput} from './link';
import {ReStructuredTextFormattingProvider} from './formatter';
import {TableEditor} from './tableEditor';
import {underline} from './underline';
import * as listEditing from './listEditing';
import {setContext} from './setContext';
import {Python} from '../util/python';
import {Logger} from '../util/logger';

const IME_SUPPRESSION_COMMAND =
    'restructuredtext.editor.ime.toggleKeybindingSuppression';
const IME_SUPPRESSION_SETTING = 'restructuredtext.editor.ime.suppressKeyBindings';
let imeStatusBarTestState: {
    visible: boolean;
    text: string;
    tooltip: string;
} = {
    visible: false,
    text: '',
    tooltip: '',
};

export function getImeStatusBarTestState(): {
    visible: boolean;
    text: string;
    tooltip: string;
} {
    return {...imeStatusBarTestState};
}

function isRstEditor(editor: vscode.TextEditor | undefined): boolean {
    return editor?.document.languageId === 'restructuredtext';
}

function getImeSuppressionEnabled(): boolean {
    return (
        vscode.workspace
            .getConfiguration('restructuredtext.editor.ime')
            .get<boolean>('suppressKeyBindings') ?? false
    );
}

function updateImeStatusBar(
    item: vscode.StatusBarItem,
    editor: vscode.TextEditor | undefined
): void {
    if (!isRstEditor(editor)) {
        imeStatusBarTestState = {
            visible: false,
            text: '',
            tooltip: '',
        };
        item.hide();
        return;
    }

    const suppressed = getImeSuppressionEnabled();
    const text = suppressed ? '$(keyboard) RST IME' : '$(keyboard) RST Keys';
    const tooltip = suppressed
        ? 'reStructuredText IME-safe mode is on. Enter and Backspace list keybindings are suppressed. Click to restore them.'
        : 'reStructuredText list keybindings are active. Click to suppress Enter and Backspace bindings for IME input.';
    item.command = IME_SUPPRESSION_COMMAND;
    item.text = text;
    item.tooltip = tooltip;
    item.backgroundColor = suppressed
        ? undefined
        : new vscode.ThemeColor('statusBarItem.prominentBackground');
    item.color = suppressed
        ? undefined
        : new vscode.ThemeColor('statusBarItem.prominentForeground');
    imeStatusBarTestState = {
        visible: true,
        text,
        tooltip,
    };
    item.show();
}

function registerFormatter(context: vscode.ExtensionContext): void {
    const formatter = new ReStructuredTextFormattingProvider();
    const formatterSelector: vscode.DocumentSelector = [
        {language: 'restructuredtext', scheme: 'file'},
        {language: 'restructuredtext', scheme: 'untitled'},
        {language: 'restructuredtext', scheme: 'vscode-userdata'},
    ];
    context.subscriptions.push(
        vscode.languages.registerDocumentFormattingEditProvider(
            formatterSelector,
            formatter
        ),
        vscode.languages.registerDocumentRangeFormattingEditProvider(
            formatterSelector,
            formatter
        )
    );
}

async function promptRstformatInstall(
    context: vscode.ExtensionContext,
    python: any
): Promise<boolean> {
    const selected = await vscode.window.showInformationMessage(
        'The reStructuredText formatter (rstformat) is not installed. Would you like to install it now?',
        'Install',
        'Learn More',
        'Disable Formatter'
    );

    if (selected === 'Install') {
        await python.installRstformat();
        return true;
    } else if (selected === 'Learn More') {
        vscode.env.openExternal(
            vscode.Uri.parse('https://github.com/lextudio/rstformat#installation')
        );
        return false;
    } else if (selected === 'Disable Formatter') {
        return false;
    }

    return false;
}

export async function activate(
    context: vscode.ExtensionContext,
    python?: Python,
    logger?: Logger
) {
    const imeStatusBar = vscode.window.createStatusBarItem(
        'restructuredtext.editor.ime.status',
        vscode.StatusBarAlignment.Right,
        50
    );
    context.subscriptions.push(imeStatusBar);

    // Run it once the first time.
    setContext();
    updateImeStatusBar(imeStatusBar, vscode.window.activeTextEditor);
    vscode.workspace.onDidCloseTextDocument(() => {
        setContext();
    });
    vscode.window.onDidChangeActiveTextEditor(() => {
        setContext();
        updateImeStatusBar(imeStatusBar, vscode.window.activeTextEditor);
    });
    vscode.window.onDidChangeTextEditorSelection(() => {
        setContext();
    });
    vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration(IME_SUPPRESSION_SETTING)) {
            updateImeStatusBar(imeStatusBar, vscode.window.activeTextEditor);
        }
    });

    const editorCommands = new EditorCommands(new VSCodeInput());
    editorCommands.register(context);

    // Formatter support with rstformat availability check
    if (python && logger) {
        const rstformatAvailable = await python.checkRstformatInstall();

        if (!rstformatAvailable) {
            const shouldEnable = await promptRstformatInstall(context, python);
            if (shouldEnable) {
                // After installation, check again
                if (!await python.checkRstformatInstall()) {
                    logger.warning(
                        'rstformat installation failed or was cancelled'
                    );
                } else {
                    registerFormatter(context);
                }
            }
        } else {
            registerFormatter(context);
        }
    } else {
        // If Python not available (web mode), still register formatter but it will fail gracefully
        registerFormatter(context);
    }

    // Section creation support.
    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand(
            'restructuredtext.features.underline.underline',
            underline
        ),
        vscode.commands.registerTextEditorCommand(
            'restructuredtext.features.underline.underlineReverse',
            (textEditor, edit) => underline(textEditor, edit, true)
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('resttext.table.createGrid', () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }
            const table = new TableEditor(editor);
            table.createEmptyGrid();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('resttext.table.dataToTable', () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }
            const table = new TableEditor(editor);
            table.dataToTable();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            IME_SUPPRESSION_COMMAND,
            async () => {
                const configuration = vscode.workspace.getConfiguration(
                    'restructuredtext.editor.ime'
                );
                const enabled = getImeSuppressionEnabled();

                await configuration.update(
                    'suppressKeyBindings',
                    !enabled,
                    vscode.ConfigurationTarget.Global
                );

                const state = !enabled ? 'enabled' : 'disabled';
                updateImeStatusBar(imeStatusBar, vscode.window.activeTextEditor);
                void vscode.window.setStatusBarMessage(
                    `reStructuredText IME keybinding suppression ${state}`,
                    3000
                );
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('resttext.key.enter', () => {
            key_enter();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('resttext.key.shift.enter', () => {
            key_shift_enter();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('resttext.key.alt.enter', () => {
            key_alt_enter();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('resttext.key.tab', () => {
            key_tab();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('resttext.key.shift.tab', () => {
            key_shift_tab();
        })
    );

    listEditing.activate(context);
}
