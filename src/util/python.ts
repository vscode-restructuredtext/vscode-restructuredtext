import { exec, ExecException } from 'child_process';
import * as fs from 'fs';
import * as vscode from 'vscode';
import { Uri } from 'vscode';
import { Configuration } from './configuration';
import { Logger } from './logger';

export class Python {
  private version: 2 | 3 | null = null;
  private pythonPath: string;
  private ready: boolean = false;

  public constructor(private readonly logger: Logger) {
  }

  public isReady(): boolean {
    return this.ready;
  }

  public async setup(resource: Uri): Promise<void> {
    if (await this.checkPython(resource)) {
      await this.checkPreviewEngine(resource, false);
      await this.checkLinter(resource, true, false); // inform users to install linter.
      await this.checkSnooty(resource, false, false);
      this.ready = true;
    }
  }

  public async checkPython(resource: vscode.Uri, showInformation: boolean = true): Promise<boolean> {
    const path = await Configuration.getPythonPath(resource);
    if (path) {
      this.pythonPath = `"${path}"`;
      if (await this.getVersion()) {
        return true;
      }
    }

    this.logger.log('Cannot find Python.');
    if (showInformation) {
      const choice = await vscode.window.showErrorMessage('Please review Python installation on this machine before using this extension.', 'Learn more...');
      if (choice === 'Learn more...') {
        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse('https://docs.restructuredtext.net/articles/prerequisites.html#install-python-for-most-features'));
      }
    }
    return false;
  }

  public async checkPreviewEngine(resource: vscode.Uri, showWarning: boolean = true): Promise<boolean> {
    if (Configuration.getConfPath(resource) === '') {
      if (Configuration.getDocUtilDisabled()) {
        if (showWarning) {
          await vscode.window.showWarningMessage('No preview. Preview engine docutil is disabled.');
        }
        return false;
      }
      if (!(await this.checkDocutilsInstall())) {
        const choice = await vscode.window.showInformationMessage('Preview engine docutil is not installed.', 'Install', 'Not now', 'Do not show again');
        if (choice === 'Install') {
          this.logger.log('Started to install docutils...');
          await this.installDocUtils();
        } else if (choice === 'Do not show again') {
          this.logger.log('Disabled docutil engine.');
          await Configuration.setDocUtilDisabled();
          if (showWarning) {
            await vscode.window.showWarningMessage('No preview. Preview engine docutil is now disabled.');
          }
          return false;
        } else {
          if (showWarning) {
            await vscode.window.showWarningMessage('No preview. Preview engine docutil is not installed.');
          }
          return false;
        }
      }
    } else {
      const sphinx = Configuration.getSphinxPath(resource);
      if (Configuration.getSphinxDisabled()) {
        if (showWarning) {
          await vscode.window.showWarningMessage('No preview. Preview engine sphinx is disabled.');
        }
        return false;
      }
      if (!(await this.checkSphinxInstall() || (sphinx != null && await fs.existsSync(sphinx)))) {
        const choice = await vscode.window.showInformationMessage('Preview engine sphinx is not installed.', 'Install', 'Not now', 'Do not show again');
        if (choice === 'Install') {
          this.logger.log('Started to install sphinx...');
          await this.installSphinx();
        } else if (choice === 'Do not show again') {
          this.logger.log('Disabled sphinx engine.');
          await Configuration.setSphinxDisabled();
          if (showWarning) {
            await vscode.window.showWarningMessage('No preview. Preview engine sphinx is now disabled.');
          }
          return false;
        } else {
          if (showWarning) {
            await vscode.window.showWarningMessage('No preview. Preview engine sphinx is not installed.');
          }
          return false;
        }
      }
    }
    return true;
  }

  public async checkLinter(resource: vscode.Uri, showInformation: boolean = true, showWarning: boolean = true): Promise<boolean> {
    if (Configuration.getLinterDisabled()) {
      if (showWarning) {
        vscode.window.showWarningMessage('No linting. Linter is disabled.');
      }
      return false;
    }
    if (Configuration.getLinterName(resource) === 'doc8') {
      const doc8 = Configuration.getLinterPath(resource);
      if (!(await this.checkDoc8Install() || (doc8 != null && await fs.existsSync(doc8)))) {
        if (showInformation) {
          const choice = await vscode.window.showInformationMessage('Linter doc8 is not installed.', 'Install', 'Not now', 'Do not show again');
          if (choice === 'Install') {
            this.logger.log('Started to install doc8...');
            await this.installDoc8();
          } else if (choice === 'Do not show again') {
            this.logger.log('Disabled linter.');
            await Configuration.setLinterDisabled();
            vscode.window.showWarningMessage('No linting. Linter is now disabled.');
            return false;
          } else {
            vscode.window.showWarningMessage('No linting. Linter doc8 is not installed.');
            return false;
          }
        } else {
          return false;
        }
      }
    } else if (Configuration.getLinterName(resource) === 'rstcheck') {
      const rstcheck = Configuration.getLinterPath(resource);
      if (!(await this.checkRstCheckInstall() || (rstcheck != null && await fs.existsSync(rstcheck)))) {
        if (showInformation) {
          const choice = await vscode.window.showInformationMessage('Linter rstcheck is not installed.', 'Install', 'Not now', 'Do not show again');
          if (choice === 'Install') {
            this.logger.log('Started to install rstcheck...');
            await this.installRstCheck();
          } else if (choice === 'Do not show again') {
            this.logger.log('Disabled linter.');
            await Configuration.setLinterDisabled();
            vscode.window.showWarningMessage('No linting. Linter is now disabled.');
            return false;
          } else {
            vscode.window.showWarningMessage('No linting. Linter rstcheck is not installed.');
            return false;
          }
        } else {
          return false;
        }
      }
    }
    return true;
  }

  public async checkSnooty(resource: vscode.Uri, showInformation: boolean = true, showWarning: boolean = true): Promise<boolean> {
    if (Configuration.getLanguageServerDisabled()) {
      if (showWarning) {
        vscode.window.showWarningMessage('No IntelliSense. Language server is disabled.');
      }
      return false;
    }
    if (!(await this.checkSnootyInstall())) {
      if (showInformation) {
        const canContinue = await this.checkPipInstall();
        if (!canContinue) {
          const upgradePip = await vscode.window.showInformationMessage('Python package pip is too old.', 'Upgrade', 'Not now');
          if (upgradePip === 'Upgrade') {
            this.logger.log('Start to upgrade pip...');
            await this.installPip();
          } else {
            vscode.window.showWarningMessage('Python package pip is too old. Snooty language server is not installed.');
            return false;
          }
        }
        const choice = await vscode.window.showInformationMessage('Snooty language server is not installed or out of date.', 'Install', 'Not now', 'Do not show again');
        if (choice === 'Install') {
          this.logger.log('Started to install Snooty...');
          await this.installSnooty();
        } else if (choice === 'Do not show again') {
          this.logger.log('Disabled language server.');
          await Configuration.setLanguageServerDisabled();
          vscode.window.showWarningMessage('No IntelliSense. Language server is now disabled.');
          return false;
        } else {
          vscode.window.showWarningMessage('No IntelliSense. Snooty language server is not installed.');
          return false;
        }
      } else {
        return false;
      }
    }
    return true;
  }

  public async checkDebugPy(resource: vscode.Uri, showInformation: boolean = true): Promise<boolean> {
    if (!(await this.checkDebugPyInstall())) {
      if (showInformation) {
        const choice = await vscode.window.showInformationMessage('Python package debugpy is not installed.', 'Install', 'Not now');
        if (choice === 'Install') {
          this.logger.log('Started to install debugpy...');
          await this.installDebugPy();
        } else {
          vscode.window.showWarningMessage('Cannot debug. Python package debugpy is not installed.');
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
      this.logger.log('Finished installing docutils');
    } catch (e) {
      this.logger.log('Failed to install docutils');
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
      this.logger.log('Finished installing doc8');
    } catch (e) {
      this.logger.log('Failed to install doc8');
      vscode.window.showErrorMessage(
        'Could not install doc8. Please run `pip install doc8` to use this ' +
          'extension, or check your Python path.'
      );
    }
  }

  private async checkDoc8Install(): Promise<boolean> {
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
      this.logger.log('Finished installing rstcheck');
    } catch (e) {
      this.logger.log('Failed to install rstcheck');
      vscode.window.showErrorMessage(
        'Could not install rstcheck. Please run `pip install rstcheck` to use this ' +
          'extension, or check your Python path.'
      );
    }
  }

  private async checkRstCheckInstall(): Promise<boolean> {
    try {
      await this.exec('-c', '"import rstcheck;"');
      return true;
    } catch (e) {
      return false;
    }
  }

  private async installSphinx(): Promise<void> {
    try {
      await this.exec('-m', 'pip', 'install', 'sphinx', 'sphinx-autobuild');
      this.logger.log('Finished installing sphinx');
    } catch (e) {
      this.logger.log('Failed to install sphinx');
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
      this.logger.log('Finished installing pip');
    } catch (e) {
      this.logger.log('Failed to install pip');
      vscode.window.showErrorMessage(
        'Could not install pip. Please run `pip install pip --upgrade` to use this ' +
          'extension, or check your Python path.'
      );
    }
  }

  private async checkPipInstall(): Promise<boolean> {
    try {
      const versionTooOld = await this.exec('-c', '"import pip; from distutils.version import LooseVersion; print(LooseVersion(pip.__version__) < LooseVersion(\'20.1.2\'))"');
      return versionTooOld.trim() === 'False';
    } catch (e) {
      return false;
    }
  }

  private async installSnooty(): Promise<void> {
    try {
      // TODO: temp cleanup. Should remove in a future release.
      await this.exec('-m', 'pip', 'uninstall', 'snooty', '-y');
      await this.exec('-m', 'pip', 'install', 'snooty-lextudio', '--upgrade');
      this.logger.log('Finished installing snooty-lextudio');
    } catch (e) {
      this.logger.log('Failed to install snooty-lextudio');
      vscode.window.showErrorMessage(
        'Could not install snooty-lextudio. Please run `pip install snooty-lextudio` to use this ' +
          'extension, or check your Python path.'
      );
    }
  }

  public async uninstallSnooty(): Promise<void> {
    try {
      await this.exec('-m', 'pip', 'uninstall', 'snooty', '-y');
      await this.exec('-m', 'pip', 'uninstall', 'snooty-lextudio', '-y');
      this.logger.log('Finished uninstalling snooty-lextudio');
    } catch (e) {
      this.logger.log('Failed to uninstall snooty-lextudio');
      vscode.window.showErrorMessage(
        'Could not uninstall snooty-lextudio. Please run `pip uninstall snooty-lextudio` to debug this ' +
          'extension.'
      );
    }
  }

  public async checkPythonForSnooty(): Promise<boolean> {
    if (this.version !== 3) {
      return false;
    }
    try {
      const versionTooOld = await this.exec('-c', '"import platform; from distutils.version import LooseVersion; print(LooseVersion(platform.python_version()) < LooseVersion(\'3.7.0\'))"');
      return versionTooOld.trim() === 'False';
    } catch (e) {
      return false;
    }
  }

  private async checkSnootyInstall(): Promise<boolean> {
    try {
      const versionTooOld = await this.exec('-c', '"import snooty; from distutils.version import LooseVersion; print(LooseVersion(snooty.__version__) < LooseVersion(\'1.11.4\'))"');
      return versionTooOld.trim() === 'False';
    } catch (e) {
      return false;
    }
  }

  private async installDebugPy(): Promise<void> {
    try {
      await this.exec('-m', 'pip', 'install', 'debugpy');
      this.logger.log('Finished installing debugpy');
    } catch (e) {
      this.logger.log('Failed to install debugpy');
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
    } catch (e) { }
    return false;
  }

  public exec(...args: string[]): Promise<string> {
    const cmd = [this.pythonPath, ...args];
    return new Promise<string>((resolve, reject) => {
      this.logger.log(`Running cmd: ${this.pythonPath} ${args.join(' ')}`);
      exec(
        cmd.join(' '),
        (error: ExecException | null, stdout: string, stderr: string) => {
          if (error) {
            const errorMessage: string = [
              error.name,
              error.message,
              error.stack,
              '',
              stderr.toString()
            ].join('\n');
            this.logger.log(errorMessage);
            reject(errorMessage);
          } else {
            this.logger.log('Successful exec');
            resolve(stdout.toString());
          }
        }
      );
    });
  }
}
