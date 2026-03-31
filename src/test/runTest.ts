import * as cp from 'child_process';
import * as path from 'path';

import {
  downloadAndUnzipVSCode,
  resolveCliArgsFromVSCodeExecutablePath,
  runTests,
} from '@vscode/test-electron';

async function runTestsWithCli(
  vscodeExecutablePath: string,
  extensionDevelopmentPath: string,
  extensionTestsPath: string
) {
  const [cli, ...profileArgs] =
    resolveCliArgsFromVSCodeExecutablePath(vscodeExecutablePath);
  const args = [
    '--new-window',
    '--wait',
    '--disable-workspace-trust',
    '--skip-welcome',
    '--skip-release-notes',
    '--extensionDevelopmentPath=' + extensionDevelopmentPath,
    '--extensionTestsPath=' + extensionTestsPath,
    ...profileArgs,
  ];

  await new Promise<void>((resolve, reject) => {
    const child = cp.spawn(cli, args, {
      env: process.env,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    child.on('error', reject);
    child.on('exit', code => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`VS Code test CLI exited with code ${code}`));
    });
  });
}

async function main() {
  try {
    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');

    // The path to the extension test script
    // Passed to --extensionTestsPath
    const extensionTestsPath = path.resolve(__dirname, './suite/index.js');

    const vscodeExecutablePath = await downloadAndUnzipVSCode();

    if (process.platform === 'darwin') {
      await runTestsWithCli(
        vscodeExecutablePath,
        extensionDevelopmentPath,
        extensionTestsPath
      );
      return;
    }

    // Download VS Code, unzip it and run the integration test
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      vscodeExecutablePath,
    });
  } catch (err) {
    console.error('Failed to run tests');
    process.exit(1);
  }
}

main();
