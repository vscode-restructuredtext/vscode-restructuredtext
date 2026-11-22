import {Buffer} from 'buffer';
import * as vscode from 'vscode';

import {defineTests} from './web.test';

interface BrowserMocha {
    setup: (options: object) => void;
    run: (callback: (failures: number) => void) => void;
}

// Mocha's browser build expects the Node Buffer global. Set it before the
// Mocha module is evaluated (hence the dynamic import below).
(globalThis as {Buffer?: typeof Buffer}).Buffer = Buffer;

export async function run(): Promise<void> {
    const mochaModule = (await import('mocha')) as unknown as {
        default?: BrowserMocha;
    } & BrowserMocha;
    const browserMocha = mochaModule.default ?? mochaModule;

    await vscode.workspace
        .getConfiguration('restructuredtext')
        .update(
            'pythonRecommendation.disabled',
            true,
            vscode.ConfigurationTarget.Global
        );

    browserMocha.setup({
        ui: 'tdd',
        reporter: undefined,
        timeout: 30000,
    });
    defineTests();

    await new Promise<void>((resolve, reject) => {
        browserMocha.run(failures => {
            if (failures > 0) {
                reject(new Error(`${failures} web tests failed.`));
            } else {
                resolve();
            }
        });
    });
}
