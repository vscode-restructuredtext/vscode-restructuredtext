/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License.
 *--------------------------------------------------------------------------------------------*/
// @ts-check
const path = require('path');
const esbuild = require('esbuild');

const args = process.argv.slice(2);

const isWatch = args.indexOf('--watch') >= 0;
const isMinify = args.indexOf('--minify') >= 0;

let outputRoot = path.join(__dirname, '..');
const outputRootIndex = args.indexOf('--outputRoot');
if (outputRootIndex >= 0) {
    outputRoot = args[outputRootIndex + 1];
}

const srcDir = path.join(outputRoot, 'src');
const outDir = path.join(outputRoot, 'dist');

function build() {
    return esbuild.build({
        entryPoints: [path.join(srcDir, 'extension.ts')],
        // inject: [path.join(srcDir, 'pre.ts')],
        bundle: true,
        minify: isMinify,
        sourcemap: !isMinify,
        format: 'cjs',
        outdir: outDir,
        platform: 'node',
        target: ['es2020'],
        external: ['vscode'],
    });
}

// eslint-disable-next-line no-process-exit
build().catch(() => process.exit(1));

if (isWatch) {
    const watcher = require('@parcel/watcher');
    watcher.subscribe(srcDir, () => {
        return build();
    });
}
