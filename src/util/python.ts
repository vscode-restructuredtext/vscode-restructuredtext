'use strict';

import {inject, injectable, named} from 'inversify';
import {exec, ExecException} from 'child_process';
import * as vscode from 'vscode';
import {Uri} from 'vscode';
import {Configuration} from './configuration';
import {Logger} from './logger';
import {NAMES, TYPES} from './../types';

@injectable()
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
            await this.checkEsbonio(resource, false, false);
            await this.checkPreviewEngine(resource, false);
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

    public async checkPreviewEngine(
        resource: vscode.Uri,
        showWarning = true
    ): Promise<boolean> {
        if (this.configuration.getConfPath(resource) === '') {
            if (this.configuration.getDocUtilDisabled()) {
                if (showWarning) {
                    await vscode.window.showWarningMessage(
                        'No preview. Preview engine docutils is disabled.'
                    );
                }
                return false;
            }
            if (!(await this.checkDocutilsInstall())) {
                const choice = await vscode.window.showInformationMessage(
                    'Preview engine docutils is not installed.',
                    'Install',
                    'Not now',
                    'Do not show again'
                );
                if (choice === 'Install') {
                    this.logger.info('Started to install docutils...');
                    await this.installDocUtils();
                } else if (choice === 'Do not show again') {
                    this.logger.info('Disabled docutils engine.');
                    await this.configuration.setDocUtilDisabled();
                    if (showWarning) {
                        await vscode.window.showWarningMessage(
                            'No preview. Preview engine docutils is now disabled.'
                        );
                    }
                    return false;
                } else {
                    if (showWarning) {
                        await vscode.window.showWarningMessage(
                            'No preview. Preview engine docutils is not installed.'
                        );
                    }
                    return false;
                }
            }
        }
        return true;
    }

    public async checkEsbonio(
        resource: vscode.Uri,
        showInformation = true,
        showWarning = true
    ): Promise<boolean> {
        if (this.configuration.getLanguageServerDisabled()) {
            if (showWarning) {
                vscode.window.showWarningMessage(
                    'No IntelliSense or live preview. Language server is disabled.'
                );
            }
            return false;
        }
        if (!(await this.checkEsbonioInstall())) {
            if (showInformation) {
                const canContinue = await this.checkPipInstall();
                if (!canContinue) {
                    const upgradePip =
                        await vscode.window.showInformationMessage(
                            'Python package pip is too old.',
                            'Upgrade',
                            'Not now'
                        );
                    if (upgradePip === 'Upgrade') {
                        this.logger.info('Start to upgrade pip...');
                        await this.installPip();
                    } else {
                        vscode.window.showWarningMessage(
                            'Python package pip is too old. Esbonio language server is not installed.'
                        );
                        return false;
                    }
                }
                const choice = await vscode.window.showInformationMessage(
                    'Esbonio language server is not installed or out of date.',
                    'Install',
                    'Not now'
                );
                if (choice === 'Install') {
                    this.logger.info('Started to install Esbonio...');
                    await this.installEsbonio();
                } else {
                    vscode.window.showWarningMessage(
                        'No IntelliSense or live preview. Esbonio language server is not installed.'
                    );
                    return false;
                }
            } else {
                return false;
            }
        }
        return true;
    }

    public async checkDebugPy(
        resource: vscode.Uri,
        showInformation = true
    ): Promise<boolean> {
        if (!(await this.checkDebugPyInstall())) {
            if (showInformation) {
                const choice = await vscode.window.showInformationMessage(
                    'Python package debugpy is not installed.',
                    'Install',
                    'Not now'
                );
                if (choice === 'Install') {
                    this.logger.info('Started to install debugpy...');
                    await this.installDebugPy();
                } else {
                    vscode.window.showWarningMessage(
                        'Cannot debug. Python package debugpy is not installed.'
                    );
                    return false;
                }
            } else {
                return false;
            }
        }
        return true;
    }

    private async installDocUtils(): Promise<void> {
        try {
            await this.exec('-m', 'pip', 'install', 'docutils');
            this.logger.info('Finished installing docutils');
            vscode.window.showInformationMessage(
                'The preview engine docutils is installed.'
            );
        } catch (e) {
            this.logger.error('Failed to install docutils');
            vscode.window.showErrorMessage(
                'Could not install docutils. Please run `pip install docutils` to use this ' +
                    'extension, or check your Python path.'
            );
        }
    }

    private async checkDocutilsInstall(): Promise<boolean> {
        try {
            await this.exec('-c', '"import docutils;"');
            return true;
        } catch (e) {
            return false;
        }
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
            await this.exec('-c', '"import doc8.main;"');
            return true;
        } catch (e) {
            return false;
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

    private async installSphinx(): Promise<void> {
        try {
            await this.exec(
                '-m',
                'pip',
                'install',
                'sphinx',
                'sphinx-autobuild'
            );
            this.logger.info('Finished installing sphinx');
            vscode.window.showInformationMessage(
                'The preview engine sphinx is installed.'
            );
        } catch (e) {
            this.logger.error('Failed to install sphinx');
            vscode.window.showErrorMessage(
                'Could not install sphinx. Please run `pip install sphinx sphinx-autobuild` to use this ' +
                    'extension, or check your Python path.'
            );
        }
    }

    private async checkSphinxInstall(): Promise<boolean> {
        try {
            await this.exec('-c', '"import sphinx;"');
            return true;
        } catch (e) {
            return false;
        }
    }

    private async installPip(): Promise<void> {
        try {
            await this.exec('-m', 'pip', 'install', 'pip', '--upgrade');
            this.logger.info('Finished installing pip');
        } catch (e) {
            this.logger.error('Failed to install pip');
            vscode.window.showErrorMessage(
                'Could not install pip. Please run `pip install pip --upgrade` to use this ' +
                    'extension, or check your Python path.'
            );
        }
    }

    private async checkPipInstall(): Promise<boolean> {
        try {
            const versionTooOld = await this.exec(
                '-c',
                '"import pip; from distutils.version import LooseVersion; print(LooseVersion(pip.__version__) < LooseVersion(\'20.0.2\'))"'
            );
            return versionTooOld.trim() === 'False';
        } catch (e) {
            return false;
        }
    }

    private async installEsbonio(): Promise<void> {
        try {
            await this.exec('-m', 'pip', 'install', 'esbonio', '--upgrade');
            this.logger.info('Finished installing esbonio');
            vscode.window.showInformationMessage(
                'Esbonio language server is installed.'
            );
        } catch (e) {
            this.logger.error('Failed to install esbonio');
            vscode.window.showErrorMessage(
                'Could not install esbonio. Please run `pip install esbonio` to use this ' +
                    'extension, or check your Python path.'
            );
        }
    }

    public async uninstallEsbonio(): Promise<void> {
        try {
            await this.exec('-m', 'pip', 'uninstall', 'esbonio', '-y');
            this.logger.info('Finished uninstalling esbonio');
        } catch (e) {
            this.logger.error('Failed to uninstall esbonio');
            vscode.window.showErrorMessage(
                'Could not uninstall esbonio. Please run `pip uninstall esbonio` to debug this ' +
                    'extension.'
            );
        }
    }

    public async checkPythonForEsbonio(): Promise<boolean> {
        if (this.version !== 3) {
            return false;
        }
        try {
            const versionTooOld = await this.exec(
                '-c',
                '"import platform; from distutils.version import LooseVersion; print(LooseVersion(platform.python_version()) < LooseVersion(\'3.6.0\'))"'
            );
            return versionTooOld.trim() === 'False';
        } catch (e) {
            return false;
        }
    }

    private async checkEsbonioInstall(): Promise<boolean> {
        try {
            const versionTooOld = await this.exec(
                '-c',
                '"import esbonio.lsp; from distutils.version import LooseVersion; print(LooseVersion(esbonio.lsp.__version__) < LooseVersion(\'0.11.2\'))"'
            );
            return versionTooOld.trim() === 'False';
        } catch (e) {
            return false;
        }
    }

    private async installDebugPy(): Promise<void> {
        try {
            await this.exec('-m', 'pip', 'install', 'debugpy');
            this.logger.info('Finished installing debugpy');
            vscode.window.showInformationMessage(
                'The helper debugpy is installed.'
            );
        } catch (e) {
            this.logger.error('Failed to install debugpy');
            vscode.window.showErrorMessage(
                'Could not install debugpy. Please run `pip install debugpy` to debug this ' +
                    'extension, or check your Python path.'
            );
        }
    }

    private async checkDebugPyInstall(): Promise<boolean> {
        try {
            await this.exec('-c', '"import debugpy;"');
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
