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
  diagnosticCode,
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

suite('doc8 Integration Tests', function () {
  this.timeout(120000);

  const previousSettings = new Map<string, unknown>();

  suiteSetup(async function () {
    clearUnsupportedReleasePrompts();
    if (!linterTestsEnabled || linterTestTarget !== 'doc8') {
      this.skip();
    }

    const config = vscode.workspace.getConfiguration('restructuredtext');
    for (const section of [
      'linter.run',
      'linter.disabledLinters',
      'linter.doc8.executablePath',
    ]) {
      previousSettings.set(section, config.inspect(section)?.globalValue);
    }

    await updateGlobalSetting('linter.run', 'onType');
    await updateGlobalSetting('linter.disabledLinters', ['rstcheck', 'rst-lint']);
    await updateGlobalSetting('linter.doc8.executablePath', linterTestExecutable);

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

  test(`reports D001 with doc8 ${linterTestVersion}`, async function () {
    if (linterTestVersion.startsWith('0.')) {
      this.skip();
    }
    const editor = await openFile(
      path.join(samplePath, 'linter', 'doc8', 'violations.rst')
    );
    await saveDocument(editor);

    const diagnostics = await waitForDiagnostics(
      editor.document.uri,
      'doc8',
      values => values.some(value => diagnosticCode(value.code) === 'D001')
    );

    assert.ok(diagnostics.length > 0);
    assert.ok(diagnostics.some(value => diagnosticCode(value.code) === 'D001'));
  });

  test('uses local pyproject.toml when running doc8', async function () {
    if (linterTestVersion.startsWith('0.')) {
      this.skip();
    }

    const fileSettings = vscode.workspace.getConfiguration('files');
    const previousTrim = fileSettings.inspect('trimTrailingWhitespace');
    await fileSettings.update(
      'trimTrailingWhitespace',
      false,
      vscode.ConfigurationTarget.Global
    );

    try {
      const editor = await openFile(
        path.join(samplePath, 'linter', 'doc8-configured', 'configured.rst')
      );
      await saveDocument(editor);

    const diagnostics = await waitForDiagnostics(
      editor.document.uri,
      'doc8',
      values => values.length > 0
    );
    const codes = diagnostics.map(value => diagnosticCode(value.code));

      assert.ok(diagnostics.length > 0);
      assert.ok(codes.includes('D002'));
      assert.ok(!codes.includes('D001'));
    } finally {
      await fileSettings.update(
        'trimTrailingWhitespace',
        previousTrim?.globalValue,
        vscode.ConfigurationTarget.Global
      );
    }
  });

  test(`prompts to upgrade unsupported doc8 ${linterTestVersion}`, async function () {
    if (!linterTestVersion.startsWith('0.')) {
      this.skip();
    }

    const editor = await openFile(
      path.join(samplePath, 'linter', 'doc8', 'violations.rst')
    );
    await saveDocument(editor);
    const promptKey = `doc8:${linterTestVersion}`;
    clearUnsupportedReleasePrompts();
    await triggerUnsupportedReleasePrompt(
      'doc8',
      linterTestVersion,
      linterTestExecutable
    );
    const prompts = await waitForUnsupportedReleasePrompt(promptKey);
    const command = await waitForUpgradeCommand(promptKey);
    const pythonPath = getExpectedPythonFromExecutable(linterTestExecutable);

    assert.ok(prompts.includes(promptKey));
    assert.strictEqual(
      command,
      `uv pip install --python "${pythonPath}" -U doc8`
    );
    const diagnostics = vscode.languages
      .getDiagnostics(editor.document.uri)
      .filter(value => value.source === 'doc8');
    assert.strictEqual(diagnostics.length, 0);
  });
});
