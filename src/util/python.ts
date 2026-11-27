'use strict';

import {inject, injectable, named} from 'inversify';
import * as cp from 'child_process';
import * as vscode from 'vscode';
import {Uri} from 'vscode';
import {Configuration} from './configuration';
import {Logger} from './logger';
import {
    MINIMUM_PYTHON,
    formatPythonVersion,
    isSupportedPythonVersion,
} from './pythonVersion';

import {NAMES, TYPES} from './../types';

@injectable()
export class Python {
    private version: {major: number; minor: number} | null = null;
    private versionPath: string | null = null;
    private reportedUnsupportedVersion: string | null = null;
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
        const path =
            process.env.RST_TEST_PYTHON ??
            (await this.configuration.getPythonPath(resource));
        if (path) {
            const pythonPath = `"${path}"`;
            if (this.pythonPath !== pythonPath) {
                this.pythonPath = pythonPath;
                this.version = null;
                this.versionPath = null;
                this.reportedUnsupportedVersion = null;
            }
            const version = await this.getVersion();
            if (version) {
                if (isSupportedPythonVersion(version.major, version.minor)) {
                    return true;
                }

                const detected = formatPythonVersion(
                    version.major,
                    version.minor
                );
                if (this.reportedUnsupportedVersion !== detected) {
                    this.reportedUnsupportedVersion = detected;
                    this.logger.error(
                        `Python ${detected} is not supported. Python ${MINIMUM_PYTHON.major}.${MINIMUM_PYTHON.minor} or newer is required. Reload the window after changing the selected interpreter.`
                    );
                    if (showInformation) {
                        this.logger.show();
                    }
                }
                return false;
            }
        }

        this.logger.error('Cannot find Python.');
        if (showInformation) {
            this.logger.info(
                'Please review Python installation on this machine before using this extension.'
            );
            this.logger.info(
                'You can learn more from https://docs.restructuredtext.net/articles/prerequisites.html#install-python-for-most-features'
            );
            this.logger.show();
        }
        return false;
    }

    private async installDoc8(): Promise<void> {
        try {
            await this.execWithTimeout(600000, '-m', 'pip', 'install', 'doc8');
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
            return await this.exec('-m', 'doc8', '--version');
        } catch (e) {
            return '0.0.0';
        }
    }

    private async installRstCheck(): Promise<void> {
        try {
            await this.execWithTimeout(
                600000,
                '-m',
                'pip',
                'install',
                'rstcheck'
            );
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
            await this.execWithTimeout(
                600000,
                '-m',
                'pip',
                'install',
                'restructuredtext_lint'
            );
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

    public async checkRstLintVersion(): Promise<string> {
        try {
            return await this.exec(
                '-c',
                '"import importlib.metadata as m; print(m.version(\'restructuredtext-lint\'))"'
            );
        } catch (e) {
            return '0.0.0';
        }
    }

    private async getVersion(): Promise<{
        major: number;
        minor: number;
    } | null> {
        if (this.version !== null && this.versionPath === this.pythonPath) {
            return this.version;
        }

        try {
            const versionPath = this.pythonPath ?? null;
            const output = await this.exec(
                '-c',
                '"import sys; print(str(sys.version_info[0]) + \'.\' + str(sys.version_info[1]))"'
            );
            const [major, minor] = output.trim().split('.').map(Number);
            if (Number.isInteger(major) && Number.isInteger(minor)) {
                const detected = {major, minor};
                if (this.pythonPath === versionPath) {
                    this.version = detected;
                    this.versionPath = versionPath;
                }
                return detected;
            }
        } catch {
            // Ignore detection failures and report Python as unavailable.
        }
        return null;
    }

    public async checkRstformatInstall(): Promise<boolean> {
        try {
            await this.exec('-m', 'pip', 'show', 'rstformat');
            return true;
        } catch (e) {
            return false;
        }
    }

    public async installRstformat(): Promise<void> {
        try {
            await this.execWithTimeout(
                600000,
                '-m',
                'pip',
                'install',
                'rstformat'
            );
            this.logger.info('Finished installing rstformat');
            vscode.window.showInformationMessage(
                'The formatter rstformat is installed.'
            );
        } catch (e) {
            this.logger.error('Failed to install rstformat');
            vscode.window.showErrorMessage(
                'Could not install rstformat. Please run `pip install rstformat` to use the formatter, or check your Python path.'
            );
        }
    }

    public exec(...args: string[]): Promise<string> {
        return this.execWithTimeout(30000, ...args);
    }

    private execWithTimeout(
        timeout: number,
        ...args: string[]
    ): Promise<string> {
        const cmd = [this.pythonPath, ...args];
        return new Promise<string>((resolve, reject) => {
            this.logger.debug(
                `Running cmd: ${this.pythonPath} ${args.join(' ')}`
            );
            if (typeof cp.exec !== 'function') {
                reject('cp.exec is undefined');
                return;
            }
            cp.exec(
                cmd.join(' '),
                {timeout},
                (error: Error | null, stdout: string, stderr: string) => {
                    if (error) {
                        const errorMessage: string = [
                            error.name,
                            error.message,
                            error.stack,
                            '',
                            stderr.toString(),
                        ].join('\n');
                        this.logger.debug(errorMessage);
                        reject(errorMessage);
                    } else {
                        this.logger.debug('Successful exec');
                        resolve(stdout.toString());
                    }
                }
            );
        });
    }
}
