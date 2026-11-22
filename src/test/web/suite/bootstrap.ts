import {Buffer} from 'buffer';
import * as vscode from 'vscode';

interface BrowserMocha {
    setup: (options: object) => void;
    run: (callback: (failures: number) => void) => void;
}

(globalThis as {Buffer?: typeof Buffer}).Buffer = Buffer;

export async function runMocha(defineTests: () => void): Promise<void> {
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
