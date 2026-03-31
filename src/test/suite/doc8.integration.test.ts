import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';

import {closeActiveWindows, openFile, samplePath} from './initialize';
import {
  clearUnsupportedReleasePrompts,
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

    await updateGlobalSetting('linter.run', 'onSave');
    await updateGlobalSetting('linter.disabledLinters', ['rstcheck', 'rst-lint']);
    await updateGlobalSetting('linter.doc8.executablePath', linterTestExecutable);
  });

  suiteTeardown(async () => {
    for (const [section, value] of previousSettings.entries()) {
      await updateGlobalSetting(section, value);
    }
  });

  setup(async () => {
    await closeActiveWindows();
    clearUnsupportedReleasePrompts();
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
    const editor = await openFile(
      path.join(samplePath, 'linter', 'doc8-configured', 'configured.rst')
    );

    const diagnostics = await waitForDiagnostics(
      editor.document.uri,
      'doc8',
      values => values.length > 0
    );
    const codes = diagnostics.map(value => diagnosticCode(value.code));

    assert.ok(diagnostics.length > 0);
    assert.ok(codes.includes('D002'));
    assert.ok(!codes.includes('D001'));
  });

  test(`prompts to upgrade unsupported doc8 ${linterTestVersion}`, async function () {
    if (!linterTestVersion.startsWith('0.')) {
      this.skip();
    }

    const editor = await openFile(
      path.join(samplePath, 'linter', 'doc8', 'violations.rst')
    );
    const promptKey = `doc8:${linterTestVersion}`;
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
