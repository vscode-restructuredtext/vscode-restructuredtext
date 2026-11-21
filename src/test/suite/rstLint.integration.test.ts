import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';

import {
  closeActiveWindows,
  openFile,
  samplePath,
  saveDocument,
} from './initialize';
import {
  clearUnsupportedReleasePrompts,
  triggerUnsupportedReleasePrompt,
  getExpectedPythonFromExecutable,
  linterTestExecutable,
  linterTestTarget,
  linterTestVersion,
  linterTestsEnabled,
  updateGlobalSetting,
  waitForDiagnostics,
  waitForUpgradeCommand,
  waitForUnsupportedReleasePrompt,
} from './linterTestUtils';

suite('rst-lint Integration Tests', function () {
  this.timeout(120000);

  const previousSettings = new Map<string, unknown>();

  suiteSetup(async function () {
    clearUnsupportedReleasePrompts();
    if (
      !linterTestsEnabled ||
      linterTestTarget !== 'rst-lint'
    ) {
      this.skip();
    }

    const config = vscode.workspace.getConfiguration('restructuredtext');
    for (const section of [
      'linter.run',
      'linter.disabledLinters',
      'linter.rst-lint.executablePath',
    ]) {
      previousSettings.set(section, config.inspect(section)?.globalValue);
    }

    await updateGlobalSetting('linter.run', 'onType');
    await updateGlobalSetting('linter.disabledLinters', ['doc8', 'rstcheck']);
    await updateGlobalSetting(
      'linter.rst-lint.executablePath',
      linterTestExecutable
    );

    await vscode.extensions
      .getExtension('lextudio.restructuredtext')
      ?.activate();

  });

  suiteTeardown(async () => {
    for (const [section, value] of previousSettings.entries()) {
      await updateGlobalSetting(section, value);
    }
  });

  setup(async () => {
    await closeActiveWindows();
  });

  teardown(async () => {
    await closeActiveWindows();
  });

  test(`reports title underline warnings with rst-lint ${linterTestVersion}`, async function () {
    if (linterTestVersion.startsWith('0.')) {
      this.skip();
    }
    const editor = await openFile(
      path.join(samplePath, 'linter', 'rst-lint', 'violations.rst')
    );
    await saveDocument(editor);

    const diagnostics = await waitForDiagnostics(
      editor.document.uri,
      'rst-lint',
      values => values.length > 0
    );

    assert.ok(diagnostics.length > 0);
    assert.ok(
      diagnostics.some(value =>
        value.message.includes('Title underline too short')
      )
    );
  });

  test(`prompts to upgrade unsupported rst-lint ${linterTestVersion}`, async function () {
    if (!linterTestVersion.startsWith('0.')) {
      this.skip();
    }

    const editor = await openFile(
      path.join(samplePath, 'linter', 'rst-lint', 'violations.rst')
    );
    await saveDocument(editor);
    const promptKey = `rst-lint:${linterTestVersion}`;
    clearUnsupportedReleasePrompts();
    await triggerUnsupportedReleasePrompt(
      'rst-lint',
      linterTestVersion,
      linterTestExecutable
    );
    const prompts = await waitForUnsupportedReleasePrompt(promptKey);
    const command = await waitForUpgradeCommand(promptKey);
    const pythonPath = getExpectedPythonFromExecutable(linterTestExecutable);

    assert.ok(prompts.includes(promptKey));
    assert.strictEqual(
      command,
      `uv pip install --python "${pythonPath}" -U restructuredtext-lint`
    );
    const diagnostics = vscode.languages
      .getDiagnostics(editor.document.uri)
      .filter(value => value.source === 'rst-lint');
    assert.strictEqual(diagnostics.length, 0);
  });
});
