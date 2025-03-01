/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License.
 *--------------------------------------------------------------------------------------------*/
// @ts-check
const esbuild = require('esbuild');
const glob = require('glob');
const path = require('path');
const polyfill = require('@esbuild-plugins/node-globals-polyfill');
const { NodeGlobalsPolyfillPlugin } = require('@esbuild-plugins/node-globals-polyfill');

// Check if this is a production build
const production = process.argv.includes('--production');

// Check if this is a watch build
const watch = process.argv.includes('--watch');

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
  external: ['vscode', '@jedithepro/system-info', 'fs', 'child_process', 'path'],
  sourcemap: !production,
  minify: production,
  platform: 'browser',
  outfile: './dist/browser/extension.js',
  mainFields: ['browser', 'module', 'main'],
  plugins: [
    NodeGlobalsPolyfillPlugin({
      process: true,
      child_process: true,
      path: true,
      fs: true,
      os: true,
    }),
  ],
  define: {
    'process.env.NODE_ENV': production ? '"production"' : '"development"',
  },
};

// Function to build
async function build() {
  try {
    // Build for Node.js
    await require('esbuild').build(buildOptions);
    console.log('Node build completed successfully');

    // Build for Web
    await require('esbuild').build(buildOptionsWeb);
    console.log('Web build completed successfully');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }

  if (watch) {
    // Start watch for Node.js
    const nodeContext = await require('esbuild').context({
      ...buildOptions,
      plugins: [...(buildOptions.plugins || [])],
    });
    await nodeContext.watch();
    console.log('Watching for Node.js changes...');

    // Start watch for Web
    const webContext = await require('esbuild').context({
      ...buildOptionsWeb,
      plugins: [...(buildOptionsWeb.plugins || [])],
    });
    await webContext.watch();
    console.log('Watching for Web changes...');
  }
}

build();
