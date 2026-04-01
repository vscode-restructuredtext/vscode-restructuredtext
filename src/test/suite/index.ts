import * as path from 'path';
import Mocha from 'mocha';
import {glob} from 'glob';
import * as vscode from 'vscode';

export function run(): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({
    ui: 'tdd',
  });

  const testsRoot = path.resolve(__dirname, '..');
  const defaultTestPatterns = [
    'activation.integration.test.js',
    'doc8.integration.test.js',
    'listEditing.integration.test.js',
    'rstLint.integration.test.js',
    'rstcheck.integration.test.js',
    'underline.test.js',
  ];
  const testPattern = process.env.RST_TEST_FILE_GLOB || defaultTestPatterns;

  return new Promise(async (c, e) => {
    try {
      await vscode.workspace
        .getConfiguration('restructuredtext')
        .update(
          'pythonRecommendation.disabled',
          true,
          vscode.ConfigurationTarget.Global
        );

      const files = (await glob(testPattern, {cwd: testsRoot})).sort();
      if (files.length === 0) {
        throw new Error(
          `No test files matched ${JSON.stringify(testPattern)} in ${testsRoot}`
        );
      }
      files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

      mocha.run(failures => {
        void vscode.commands.executeCommand('workbench.action.closeWindow');
        if (failures > 0) {
          e(new Error(`${failures} tests failed.`));
        } else {
          c();
        }
      });
    } catch (err) {
      console.error(err);
      e(err);
    }
  });
}
