'use strict';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {inject, injectable, named} from 'inversify';
import {exec, ExecException} from 'child_process';
import * as vscode from 'vscode';
import {Uri} from 'vscode';
import {Configuration} from './configuration';
import {Logger} from './logger';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {NAMES, TYPES} from './../types';

@injectable()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class Python {
    private version: 2 | 3 | null = null;
    private pythonPath: string | undefined;
    private ready: boolean = false;

    public constructor(
        @inject(TYPES.Logger)
        @named(NAMES.Main)
        private readonly logger: Logger,
        @inject(TYPES.Configuration)
        private readonly configuration: Configuration
    ) {}

    public isReady(): boolean {
        return this.ready;
    }

    public async setup(resource?: Uri): Promise<void> {
        if (await this.checkPython(resource)) {
            this.ready = true;
        }
    }

    public async checkPython(
        resource: vscode.Uri,
        showInformation = true
    ): Promise<boolean> {
        const path = await this.configuration.getPythonPath(resource);
        if (path) {
            this.pythonPath = `"${path}"`;
            if (await this.getVersion()) {
                return true;
            }
        }

        this.logger.error('Cannot find Python.');
        if (showInformation) {
            const choice = await vscode.window.showErrorMessage(
                'Please review Python installation on this machine before using this extension.',
                'Learn more...'
            );
            if (choice === 'Learn more...') {
                vscode.commands.executeCommand(
                    'vscode.open',
                    vscode.Uri.parse(
                        'https://docs.restructuredtext.net/articles/prerequisites.html#install-python-for-most-features'
                    )
                );
            }
        }
        return false;
    }

    private async installDoc8(): Promise<void> {
        try {
            await this.exec('-m', 'pip', 'install', 'doc8');
            this.logger.info('Finished installing doc8');
            vscode.window.showInformationMessage(
                'The linter doc8 is installed.'
            );
        } catch (e) {
            this.logger.error('Failed to install doc8');
            vscode.window.showErrorMessage(
                'Could not install doc8. Please run `pip install doc8` to use this ' +
                    'linter, or check your Python path.'
            );
        }
    }

    public async checkDoc8Install(): Promise<boolean> {
        try {
            await this.exec('-c', '"import doc8;"');
            return true;
        } catch (e) {
            return false;
        }
    }

    public async checkDoc8Version(): Promise<string> {
        try {
            return await this.exec(
                '-c',
                '"import doc8; print(doc8.__version__)"'
            );
        } catch (e) {
            return '0.0.0';
        }
    }

    private async installRstCheck(): Promise<void> {
        try {
            await this.exec('-m', 'pip', 'install', 'rstcheck');
            this.logger.info('Finished installing rstcheck');
            vscode.window.showInformationMessage(
                'The linter rstcheck is installed.'
            );
        } catch (e) {
            this.logger.error('Failed to install rstcheck');
            vscode.window.showErrorMessage(
                'Could not install rstcheck. Please run `pip install rstcheck` to use this ' +
                    'linter, or check your Python path.'
            );
        }
    }

    public async checkRstCheckInstall(): Promise<boolean> {
        try {
            await this.exec('-c', '"import rstcheck;"');
            return true;
        } catch (e) {
            return false;
        }
    }

    public async checkRstCheckVersion(): Promise<string> {
        try {
            return await this.exec(
                '-c',
                '"from rstcheck import __version__; print(__version__.__version__)"'
            );
        } catch (e) {
            try {
                return await this.exec(
                    '-c',
                    '"import rstcheck; print(rstcheck.__version__)"'
                );
            } catch (e) {
                return '0.0.0';
            }
        }
    }

    private async installRstLint(): Promise<void> {
        try {
            await this.exec('-m', 'pip', 'install', 'restructuredtext_lint');
            this.logger.info('Finished installing restructuredtext_lint');
            vscode.window.showInformationMessage(
                'The linter restructuredtext_lint is installed.'
            );
        } catch (e) {
            this.logger.error('Failed to install restructuredtext_lint');
            vscode.window.showErrorMessage(
                'Could not install restructuredtext_lint. Please run `pip install restructuredtext_lint` to use this ' +
                    'linter, or check your Python path.'
            );
        }
    }

    public async checkRstLintInstall(): Promise<boolean> {
        try {
            await this.exec('-c', '"import restructuredtext_lint;"');
            return true;
        } catch (e) {
            return false;
        }
    }

    private async getVersion(): Promise<boolean> {
        if (this.version !== null) {
            return true;
        }

        try {
            const version = await this.exec(
                '-c',
                '"import sys; print(sys.version_info[0])"'
            );
            switch (Number.parseInt(version)) {
                case 2:
                    this.version = 2;
                    return true;
                case 3:
                    this.version = 3;
                    return true;
            }
            // eslint-disable-next-line no-empty
        } catch (e) {}
        return false;
    }

    public exec(...args: string[]): Promise<string> {
        const cmd = [this.pythonPath, ...args];
        return new Promise<string>((resolve, reject) => {
            this.logger.info(
                `Running cmd: ${this.pythonPath} ${args.join(' ')}`
            );
            exec(
                cmd.join(' '),
                (
                    error: ExecException | null,
                    stdout: string,
                    stderr: string
                ) => {
                    if (error) {
                        const errorMessage: string = [
                            error.name,
                            error.message,
                            error.stack,
                            '',
                            stderr.toString(),
                        ].join('\n');
                        this.logger.error(errorMessage);
                        reject(errorMessage);
                    } else {
                        this.logger.info('Successful exec');
                        resolve(stdout.toString());
                    }
                }
            );
        });
    }
}
