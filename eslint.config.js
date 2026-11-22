'use strict';

const globals = require('globals');
const gts = require('gts');

module.exports = [
    ...gts,
    {
        ignores: [
            '.claude/',
            '.tmp-linter-matrix/',
            '.venv-linter-tests/',
            '.vscode-test/',
            '.vscode-test-web/',
            'bin/',
            'build/',
            'dist/',
            'media/',
            'node_modules/',
            'out/',
            'src/test/',
            'test/',
            'test-resources/',
            '**/*.d.ts',
        ],
    },
    {
        files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
        languageOptions: {
            globals: globals.node,
        },
        rules: {
            'no-unused-vars': ['error', {caughtErrors: 'none'}],
        },
    },
    {
        files: ['**/*.ts', '**/*.tsx'],
        rules: {
            // These violations predate the gts 7 upgrade. Keep them visible without
            // blocking lint until they are addressed separately.
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-floating-promises': 'warn',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    caughtErrors: 'none',
                    varsIgnorePattern: '^_',
                },
            ],
        },
    },
];
