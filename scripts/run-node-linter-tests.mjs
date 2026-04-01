import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..');
const matrix = [
  {target: 'doc8', version: '1.1.2'},
  {target: 'doc8', version: '2.0.0'},
  {target: 'doc8', version: '0.11.2'},
  {target: 'rstcheck', version: '5.0.0'},
  {target: 'rstcheck', version: '6.2.5'},
  {target: 'rstcheck', version: '4.1.0'},
  {target: 'rst-lint', version: '0.18.0'},
  {target: 'rst-lint', version: '1.4.0'},
  {target: 'rst-lint', version: '2.0.2'},
];
const testFiles = {
  doc8: 'doc8.integration.test.js',
  rstcheck: 'rstcheck.integration.test.js',
  'rst-lint': 'rstLint.integration.test.js',
};

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    env,
  });

  if (result.status !== 0) {
    console.error(`Command failed: ${command} ${args.join(' ')}`);
    process.exit(result.status ?? 1);
  }
}

for (const entry of matrix) {
  console.log(`\n=== ${entry.target} ${entry.version} ===`);
  run('node', ['./scripts/setup-linter-test-env.mjs', entry.target, entry.version]);

  const metadataPath = path.join(
    repoRoot,
    '.venv-linter-tests',
    `${entry.target}-${entry.version}`,
    'test-env.json'
  );
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

  run('node', ['./dist/test/runTest.js'], {
    ...process.env,
    PATH: `${metadata.binDir}${path.delimiter}${process.env.PATH ?? ''}`,
    RST_LINTER_TESTS: '1',
    RST_TEST_FILE_GLOB: testFiles[metadata.target],
    RST_LINTER_TEST_TARGET: metadata.target,
    RST_LINTER_TEST_VERSION: metadata.version,
    RST_LINTER_TEST_EXECUTABLE: metadata.executablePath,
    RST_LINTER_TEST_SUPPRESS_PROMPTS: '1',
  });
}
