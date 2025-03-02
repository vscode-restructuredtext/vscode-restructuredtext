/* eslint-disable quotes */
/* eslint-disable prettier/prettier */
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License.
 *--------------------------------------------------------------------------------------------*/
// @ts-check
const esbuild = require('esbuild');
const {NodeGlobalsPolyfillPlugin} = require('@esbuild-plugins/node-globals-polyfill');
const {NodeModulesPolyfillPlugin} = require('@esbuild-plugins/node-modules-polyfill');

// Check if this is a production build
const production = process.argv.includes('--production');

// Check if this is a watch build
const watch = process.argv.includes('--watch');

const esbuildProblemMatcherPlugin = {
    name: "esbuild-problem-matcher",

    setup(build) {
        build.onStart(() => {
            console.log("[esbuild] build started");
        });
        build.onEnd((result) => {
            result.errors.forEach(({ text, location }) => {
                console.error(`✘ [ERROR] ${text}`);
                if (location) {
                    console.error(`    ${location.file}:${location.line}:${location.column}:`);
                }
            });
            console.log("[esbuild] build finished");
        });
    },
};

const buildOptions = {
    entryPoints: ['./src/extension.ts'],
    bundle: true,
    external: ['vscode'],
    sourcemap: !production,
    minify: production,
    platform: 'node',
    outfile: './dist/node/extension.js',
    mainFields: ['module', 'main'],
};

const buildOptionsWeb = {
    entryPoints: ['./src/extension.ts'],
    bundle: true,
    external: ['vscode', '@jedithepro/system-info'],
    sourcemap: !production,
    minify: production,
    platform: 'browser',
    outfile: './dist/browser/extension.js',
    mainFields: ['browser', 'module', 'main'],
    plugins: [
        NodeGlobalsPolyfillPlugin(),
        NodeModulesPolyfillPlugin({
            modules: ['path', 'child_process'],
        }),
        esbuildProblemMatcherPlugin,
    ],
    define: {
        'process.env.NODE_ENV': production ? '"production"' : '"development"',
        global: 'globalThis',
    },
};

// Function to build
async function build() {
    try {
        // Build for Node.js
        await esbuild.build(buildOptions);
        console.log('Node build completed successfully');

        // Build for Web
        await esbuild.build(buildOptionsWeb);
        console.log('Web build completed successfully');
    } catch (err) {
        console.error(err);
        process.exit(1);
    }

    if (watch) {
        // Start watch for Node.js
        const nodeContext = await esbuild.context({
            ...buildOptions,
            plugins: [...(buildOptions.plugins || [])],
        });
        await nodeContext.watch();
        console.log('Watching for Node.js changes...');

        // Start watch for Web
        const webContext = await esbuild.context({
            ...buildOptionsWeb,
            plugins: [...(buildOptionsWeb.plugins || [])],
        });
        await webContext.watch();
        console.log('Watching for Web changes...');
    }
}

build();
