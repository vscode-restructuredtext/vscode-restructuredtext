import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [, , target, version] = process.argv;

if (!target || !version) {
  console.error('Usage: node scripts/setup-linter-test-env.mjs <target> <version>');
  process.exit(1);
}

const packageNames = {
  doc8: 'doc8',
  rstcheck: 'rstcheck',
  'rst-lint': 'restructuredtext-lint',
};

const executableNames = {
  doc8: 'doc8',
  rstcheck: 'rstcheck',
  'rst-lint': 'rst-lint',
};

const packageName = packageNames[target];
const executableName = executableNames[target];

if (!packageName || !executableName) {
  console.error(`Unsupported linter target: ${target}`);
  process.exit(1);
}

const repoRoot = path.resolve(import.meta.dirname, '..');
const envDir = path.join(repoRoot, '.venv-linter-tests', `${target}-${version}`);
const isWindows = process.platform === 'win32';
const binDir = path.join(envDir, isWindows ? 'Scripts' : 'bin');
const pythonPath = path.join(
  binDir,
  isWindows ? 'python.exe' : 'python'
);
const executablePath = path.join(
  binDir,
  isWindows ? `${executableName}.exe` : executableName
);

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

fs.mkdirSync(envDir, {recursive: true});
run('uv', ['venv', '--python', 'python3.11', envDir]);
run('uv', ['pip', 'install', '--python', pythonPath, `${packageName}==${version}`]);

const outputPath = path.join(envDir, 'test-env.json');
fs.writeFileSync(
  outputPath,
  JSON.stringify({target, version, pythonPath, executablePath, binDir}, null, 2) +
    '\n'
);

console.log(`Prepared ${target} ${version} test environment at ${envDir}`);
