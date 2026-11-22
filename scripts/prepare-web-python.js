'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PYODIDE_CDN_ROOT = 'https://cdn.jsdelivr.net/pyodide';
const PYODIDE_PACKAGES = [
    'micropip',
    'docutils',
    'pygments',
    'packaging',
    'pydantic',
    'pydantic-core',
    'typing-extensions',
    'annotated-types',
];
const CORE_FILES = [
    'pyodide.js',
    'pyodide.asm.js',
    'pyodide.asm.wasm',
    'python_stdlib.zip',
    'pyodide-lock.json',
];

function sha256(bytes) {
    return crypto.createHash('sha256').update(bytes).digest('hex');
}

async function download(url, target, expectedSha256) {
    if (fs.existsSync(target) && fs.statSync(target).size > 0) {
        const cached = fs.readFileSync(target);
        if (!expectedSha256 || sha256(cached) === expectedSha256) {
            return cached;
        }
        fs.rmSync(target);
    }
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to download ${url}: ${response.status}`);
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    if (expectedSha256 && sha256(bytes) !== expectedSha256) {
        throw new Error(`Checksum mismatch for ${url}`);
    }
    fs.writeFileSync(target, bytes);
    return bytes;
}

async function prepareWebPython() {
    const root = path.resolve(__dirname, '..');
    const pyodideSource = path.join(root, 'node_modules', 'pyodide');
    const packageCache = path.join(root, 'web', 'python', 'pyodide-packages');
    const outputRoot = path.join(root, 'dist', 'web');
    const pyodideOutput = path.join(outputRoot, 'pyodide');
    const wheelsOutput = path.join(outputRoot, 'wheels');

    if (!fs.existsSync(pyodideSource)) {
        throw new Error(
            'The pyodide package is missing. Run npm install before compiling.'
        );
    }

    const pyodideVersion = JSON.parse(
        fs.readFileSync(path.join(pyodideSource, 'package.json'), 'utf8')
    ).version;
    const pyodideCdn = `${PYODIDE_CDN_ROOT}/v${pyodideVersion}/full/`;

    fs.mkdirSync(packageCache, {recursive: true});
    fs.mkdirSync(pyodideOutput, {recursive: true});
    fs.mkdirSync(wheelsOutput, {recursive: true});

    for (const file of CORE_FILES) {
        fs.copyFileSync(
            path.join(pyodideSource, file),
            path.join(pyodideOutput, file)
        );
    }

    const lock = JSON.parse(
        fs.readFileSync(path.join(pyodideSource, 'pyodide-lock.json'), 'utf8')
    );
    for (const name of PYODIDE_PACKAGES) {
        const file = lock.packages[name]?.file_name;
        if (!file) {
            throw new Error(`Pyodide package ${name} is missing from the lock`);
        }
        const target = path.join(packageCache, file);
        await download(
            `${pyodideCdn}${file}`,
            target,
            lock.packages[name].sha256
        );
        fs.copyFileSync(target, path.join(pyodideOutput, file));
    }

    const wheels = fs
        .readdirSync(path.join(root, 'web', 'python', 'wheels'))
        .filter(file => file.endsWith('.whl'));
    if (wheels.length === 0) {
        throw new Error('No bundled Python wheels found');
    }
    for (const wheel of wheels) {
        fs.copyFileSync(
            path.join(root, 'web', 'python', 'wheels', wheel),
            path.join(wheelsOutput, wheel)
        );
    }
    fs.writeFileSync(
        path.join(wheelsOutput, 'manifest.json'),
        JSON.stringify(wheels)
    );

    console.log(
        `Bundled Pyodide ${pyodideVersion} with ${wheels.length} wheels.`
    );
}

module.exports = {prepareWebPython};
