import * as fs from 'fs';
import * as path from 'path';
import Mocha from 'mocha';
import {glob} from 'glob';
import * as vscode from 'vscode';

function writeResults(failures: number, tests: number): void {
  const file = process.env.RST_TEST_RESULT_FILE;
  if (!file) {
    return;
  }
  try {
    fs.writeFileSync(file, JSON.stringify({failures, tests}));
  } catch (error) {
    console.error(`Failed to write test results: ${error}`);
  }
}

export function run(): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({
    ui: 'tdd',
  });

  const testsRoot = path.resolve(__dirname);
  process.env.RST_TEST_MODE = '1';
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

      const runner = mocha.run(failures => {
        writeResults(failures, runner.stats?.tests ?? 0);
        if (failures > 0) {
          e(new Error(`${failures} tests failed.`));
        } else {
          void vscode.commands
            .executeCommand('workbench.action.closeWindow')
            .then(() => c(), c);
        }
      });
    } catch (err) {
      console.error(err);
      writeResults(1, 0);
      e(err);
    }
  });
}
