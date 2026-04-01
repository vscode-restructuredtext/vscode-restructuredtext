import * as assert from 'assert';
import * as vscode from 'vscode';

import {getImeStatusBarTestState} from '../../editor/extension';
import {closeActiveWindows, wait} from './initialize';

async function openListDocument(content: string): Promise<vscode.TextEditor> {
  const document = await vscode.workspace.openTextDocument({
    content,
    language: 'restructuredtext',
  });
  return vscode.window.showTextDocument(document);
}

function setCursor(
  editor: vscode.TextEditor,
  line: number,
  character: number
): void {
  const position = new vscode.Position(line, character);
  editor.selection = new vscode.Selection(position, position);
}

function setSelection(
  editor: vscode.TextEditor,
  startLine: number,
  startCharacter: number,
  endLine: number,
  endCharacter: number
): void {
  editor.selection = new vscode.Selection(
    new vscode.Position(startLine, startCharacter),
    new vscode.Position(endLine, endCharacter)
  );
}

async function runListCommand(command: string): Promise<void> {
  await vscode.commands.executeCommand(command);
  await wait(50);
}

suite('List Editing Integration Tests', function () {
  this.timeout(120000);
  const previousSettings = new Map<string, unknown>();

  suiteSetup(async () => {
    const ordered = vscode.workspace.getConfiguration(
      'restructuredtext.editor.listEditing.orderedList'
    );
    const list = vscode.workspace.getConfiguration(
      'restructuredtext.editor.listEditing.list'
    );
    previousSettings.set('ordered.autoRenumber', ordered.inspect('autoRenumber')?.globalValue);
    previousSettings.set('ordered.marker', ordered.inspect('marker')?.globalValue);
    previousSettings.set(
      'list.indentationSize',
      list.inspect('indentationSize')?.globalValue
    );
    previousSettings.set(
      'ime.suppressKeyBindings',
      vscode.workspace
        .getConfiguration('restructuredtext.editor.ime')
        .inspect('suppressKeyBindings')?.globalValue
    );

    await ordered.update('autoRenumber', true, vscode.ConfigurationTarget.Global);
    await ordered.update('marker', 'ordered', vscode.ConfigurationTarget.Global);
    await list.update('indentationSize', 'adaptive', vscode.ConfigurationTarget.Global);
    await vscode.workspace
      .getConfiguration('restructuredtext.editor.ime')
      .update('suppressKeyBindings', false, vscode.ConfigurationTarget.Global);
  });

  suiteTeardown(async () => {
    const ordered = vscode.workspace.getConfiguration(
      'restructuredtext.editor.listEditing.orderedList'
    );
    const list = vscode.workspace.getConfiguration(
      'restructuredtext.editor.listEditing.list'
    );

    await ordered.update(
      'autoRenumber',
      previousSettings.get('ordered.autoRenumber'),
      vscode.ConfigurationTarget.Global
    );
    await ordered.update(
      'marker',
      previousSettings.get('ordered.marker'),
      vscode.ConfigurationTarget.Global
    );
    await list.update(
      'indentationSize',
      previousSettings.get('list.indentationSize'),
      vscode.ConfigurationTarget.Global
    );
    await vscode.workspace
      .getConfiguration('restructuredtext.editor.ime')
      .update(
        'suppressKeyBindings',
        previousSettings.get('ime.suppressKeyBindings'),
        vscode.ConfigurationTarget.Global
      );
  });

  setup(async () => {
    await closeActiveWindows();
  });

  teardown(async () => {
    await closeActiveWindows();
  });

  test('continues an unordered list item on enter', async () => {
    const editor = await openListDocument('- item');

    setCursor(editor, 0, editor.document.lineAt(0).text.length);
    await runListCommand('restructuredtext.editor.listEditing.onEnterKey');

    assert.strictEqual(editor.document.getText(), '- item\n- ');
  });

  test('removes an empty list item on enter', async () => {
    const editor = await openListDocument('- ');

    setCursor(editor, 0, editor.document.lineAt(0).text.length);
    await runListCommand('restructuredtext.editor.listEditing.onEnterKey');

    assert.strictEqual(editor.document.getText(), '');
  });

  test('toggles task list items for the selected lines', async () => {
    const editor = await openListDocument('- [ ] one\n- [ ] two');

    setSelection(editor, 0, 0, 1, editor.document.lineAt(1).text.length);
    await runListCommand('restructuredtext.editor.listEditing.checkTaskList');

    assert.strictEqual(editor.document.getText(), '- [x] one\n- [x] two');
  });

  test('indents and outdents list items with explicit commands', async () => {
    const editor = await openListDocument('- parent\n- child');

    setSelection(editor, 1, 0, 1, editor.document.lineAt(1).text.length);
    await runListCommand('restructuredtext.editor.listEditing.onIndentLines');
    assert.strictEqual(editor.document.getText(), '- parent\n  - child');

    setSelection(editor, 1, 0, 1, editor.document.lineAt(1).text.length);
    await runListCommand('restructuredtext.editor.listEditing.onOutdentLines');
    assert.strictEqual(editor.document.getText(), '- parent\n- child');
  });

  test('renumbers ordered lists after moving a line down', async () => {
    const editor = await openListDocument('1. one\n2. two\n3. three');

    setSelection(editor, 1, 0, 1, editor.document.lineAt(1).text.length);
    await runListCommand('restructuredtext.editor.listEditing.onMoveLineDown');

    assert.strictEqual(
      editor.document.getText(),
      '1. one\n2. three\n3. two'
    );
  });

  test('toggles IME keybinding suppression from the command palette command', async () => {
    const configuration = vscode.workspace.getConfiguration(
      'restructuredtext.editor.ime'
    );
    await openListDocument('- item');
    await wait(100);

    assert.strictEqual(
      configuration.get<boolean>('suppressKeyBindings'),
      false
    );
    assert.deepStrictEqual(getImeStatusBarTestState().visible, true);
    assert.ok(getImeStatusBarTestState().text.includes('RST Keys'));

    await vscode.commands.executeCommand(
      'restructuredtext.editor.ime.toggleKeybindingSuppression'
    );
    await wait(50);

    assert.strictEqual(
      configuration.get<boolean>('suppressKeyBindings'),
      true
    );
    assert.ok(getImeStatusBarTestState().text.includes('RST IME'));
    assert.ok(
      getImeStatusBarTestState().tooltip.includes('IME-safe mode is on')
    );

    await vscode.commands.executeCommand(
      'restructuredtext.editor.ime.toggleKeybindingSuppression'
    );
    await wait(50);

    assert.strictEqual(
      configuration.get<boolean>('suppressKeyBindings'),
      false
    );
    assert.ok(getImeStatusBarTestState().text.includes('RST Keys'));
  });
});
