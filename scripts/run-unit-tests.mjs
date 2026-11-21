import {spawnSync} from 'node:child_process';

const result = spawnSync(
    process.execPath,
    [
        'node_modules/mocha/bin/mocha.js',
        '--require',
        'ts-node/register/transpile-only',
        'test/unit/**/*.test.ts',
    ],
    {
        stdio: 'inherit',
        env: {...process.env, TS_NODE_TRANSPILE_ONLY: '1'},
    }
);

process.exit(result.status ?? 1);
