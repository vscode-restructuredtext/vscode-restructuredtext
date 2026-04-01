import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import {
  downloadAndUnzipVSCode,
  resolveCliPathFromVSCodeExecutablePath,
  runTests,
} from '@vscode/test-electron';

const DEFAULT_TEST_TIMEOUT_MS = 5 * 60 * 1000;

function getTestTimeoutMs(): number {
  const raw = process.env.RST_TEST_TIMEOUT_MS;
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TEST_TIMEOUT_MS;
}

function tailFile(filePath: string, maxLines = 40): string[] {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const lines = fs.readFileSync(filePath, 'utf8').trim().split('\n');
  return lines.slice(-maxLines);
}

function printRunSummary(runProfileDir: string): void {
  const logsRoot = path.join(runProfileDir, 'user-data', 'logs');
  console.error(`Test run profile: ${runProfileDir}`);

  if (!fs.existsSync(logsRoot)) {
    console.error('No VS Code logs were created for this run.');
    return;
  }

  const logDirs = fs
    .readdirSync(logsRoot, {withFileTypes: true})
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();
  const latestLogDir = logDirs.at(-1);
  if (!latestLogDir) {
    console.error(`No timestamped logs found under ${logsRoot}`);
    return;
  }

  const latestRoot = path.join(logsRoot, latestLogDir);
  console.error(`Latest VS Code log dir: ${latestRoot}`);

  const logFiles = [
    {label: 'main', file: path.join(latestRoot, 'main.log')},
    {label: 'renderer', file: path.join(latestRoot, 'window1', 'renderer.log')},
    {
      label: 'exthost',
      file: path.join(latestRoot, 'window1', 'exthost', 'exthost.log'),
    },
  ];

  for (const {label, file} of logFiles) {
    const lines = tailFile(file);
    if (lines.length === 0) {
      continue;
    }

    console.error(`\n--- ${label}: ${file} ---`);
    for (const line of lines) {
      console.error(line);
    }
  }
}

async function runTestsWithCli(
  vscodeExecutablePath: string,
  extensionDevelopmentPath: string,
  extensionTestsPath: string
) {
  const cli = resolveCliPathFromVSCodeExecutablePath(vscodeExecutablePath);
  const profilesRoot = path.resolve(extensionDevelopmentPath, '.vscode-test');
  fs.mkdirSync(profilesRoot, {recursive: true});
  const runProfileDir = fs.mkdtempSync(
    path.join(profilesRoot, 'run-')
  );
  const userDataDir = path.join(runProfileDir, 'user-data');
  const extensionsDir = path.join(runProfileDir, 'extensions');
  fs.mkdirSync(userDataDir, {recursive: true});
  fs.mkdirSync(extensionsDir, {recursive: true});
  const args = [
    extensionDevelopmentPath,
    '--new-window',
    '--wait',
    '--disable-workspace-trust',
    '--skip-welcome',
    '--skip-release-notes',
    '--disable-extensions',
    '--extensionDevelopmentPath=' + extensionDevelopmentPath,
    '--extensionTestsPath=' + extensionTestsPath,
    '--extensions-dir=' + extensionsDir,
    '--user-data-dir=' + userDataDir,
  ];
  const timeoutMs = getTestTimeoutMs();

  await new Promise<void>((resolve, reject) => {
    const child = cp.spawn(cli, args, {
      env: process.env,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    let finished = false;
    const timeout = setTimeout(() => {
      if (finished) {
        return;
      }
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 5000).unref();
      reject(
        new Error(
          `VS Code test CLI timed out after ${timeoutMs}ms. Run profile: ${runProfileDir}`
        )
      );
    }, timeoutMs);
    timeout.unref();

    child.on('error', error => {
      if (finished) {
        return;
      }
      finished = true;
      clearTimeout(timeout);
      reject(error);
    });
    child.on('exit', code => {
      if (finished) {
        return;
      }
      finished = true;
      clearTimeout(timeout);
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `VS Code test CLI exited with code ${code}. Run profile: ${runProfileDir}`
        )
      );
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

    const vscodeExecutablePath = await downloadAndUnzipVSCode(
      process.platform === 'darwin' ? 'insiders' : undefined
    );

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
    const message = err instanceof Error ? err.message : String(err);
    console.error(message);
    const match = /Run profile: (.+)$/.exec(message);
    if (match?.[1]) {
      printRunSummary(match[1]);
    }
    process.exit(1);
  }
}

main();
