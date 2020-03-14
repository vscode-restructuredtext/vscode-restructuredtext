import * as vscode from "vscode";
import { exec, ExecException } from "child_process";
import { Logger } from "./logger";
import { Configuration } from './features/utils/configuration';
import { fileExists } from './common';
import { Uri } from 'vscode';
import { appendFileSync } from 'fs';

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
    const path = Configuration.getPythonPath(resource);
    if (path) {
      this.pythonPath = `"${path}"`;
      await this.getVersion();
      await this.checkPreviewEngine(resource, false);
      await this.checkLinter(resource, true, false);
    } else {
      this.logger.log("Cannot find Python.");
      var choice = await vscode.window.showErrorMessage("Please review Python installation on this machine before using this extension.", "Learn more...");
      if (choice === "Learn more...") {
        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse('https://docs.restructuredtext.net/articles/prerequisites.html#install-python-for-most-features'));
      }
    }

    this.ready = true;
  }

  public async checkPreviewEngine(resource: vscode.Uri, showWarning: boolean = true): Promise<boolean> {
    if (Configuration.getConfPath(resource) === '') {
      if (Configuration.getDocUtilDisabled()) {
        if (showWarning) {
          await vscode.window.showWarningMessage("No preview. Preview engine docutil is disabled.");
        }
        return false;
      }
      if (!(await this.checkDocutilsInstall())) {
        var choice = await vscode.window.showInformationMessage("Preview engine docutil is not installed.", "Install", "Not now", "Do not show again");
        if (choice === "Install") {
          this.logger.log("Started to install docutils...");
          await this.installDocUtils();
        } else if (choice === "Do not show again") {
          this.logger.log("Disabled docutil engine.");
          await Configuration.setDocUtilDisabled();
          if (showWarning) {
            await vscode.window.showWarningMessage("No preview. Preview engine docutil is now disabled.");
          }
          return false;
        } else {
          if (showWarning) {
            await vscode.window.showWarningMessage("No preview. Preview engine docutil is not installed.");
          }
          return false;
        }
      }
    } else {
      const sphinx = Configuration.getSphinxPath(resource);
      if (Configuration.getSphinxDisabled()) {
        if (showWarning) {
          await vscode.window.showWarningMessage("No preview. Preview engine sphinx is disabled.");
        }
        return false;
      }
      if (!(await this.checkSphinxInstall() || (sphinx != null && await fileExists(sphinx)))) {
        var choice = await vscode.window.showInformationMessage("Preview engine sphinx is not installed.", "Install", "Not now", "Do not show again");
        if (choice === "Install") {
          this.logger.log("Started to install sphinx...");
          await this.installSphinx();
        } else if (choice === "Do not show again") {
          this.logger.log("Disabled sphinx engine.");
          await Configuration.setSphinxDisabled();
          if (showWarning) {
            await vscode.window.showWarningMessage("No preview. Preview engine sphinx is now disabled.");
          }
          return false;
        } else {
          if (showWarning) {
            await vscode.window.showWarningMessage("No preview. Preview engine sphinx is not installed.");
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
        vscode.window.showWarningMessage("No linting. Linter is disabled.");
      }
      return false;
    }
    if (Configuration.getLinterName(resource) === "doc8") {
      const doc8 = Configuration.getLinterPath(resource);
      if (!(await this.checkDoc8Install() || (doc8 != null && await fileExists(doc8)))) {
        if (showInformation) {
          var choice = await vscode.window.showInformationMessage("Linter doc8 is not installed.", "Install", "Not now", "Do not show again");
          if (choice === "Install") {
            this.logger.log("Started to install doc8...");
            await this.installDoc8();
          } else if (choice === "Do not show again") {
            this.logger.log("Disabled linter.");
            await Configuration.setLinterDisabled();
            vscode.window.showWarningMessage("No linting. Linter is now disabled.");
            return false;
          } else {
            vscode.window.showWarningMessage("No linting. Linter doc8 is not installed.");
            return false;
          }
        } else {
          return false;
        }
      }
    } else if (Configuration.getLinterName(resource) === "rstcheck") {
      const rstcheck = Configuration.getLinterPath(resource);
      if (!(await this.checkRstCheckInstall() || (rstcheck != null && await fileExists(rstcheck)))) {
        if (showInformation) {
          var choice = await vscode.window.showInformationMessage("Linter rstcheck is not installed.", "Install", "Not now", "Do not show again");
          if (choice === "Install") {
            this.logger.log("Started to install rstcheck...");
            await this.installRstCheck();
          } else if (choice === "Do not show again") {
            this.logger.log("Disabled linter.");
            await Configuration.setLinterDisabled();
            vscode.window.showWarningMessage("No linting. Linter is now disabled.");
            return false;
          } else {
            vscode.window.showWarningMessage("No linting. Linter rstcheck is not installed.");
            return false;
          }
        } else {
          return false;
        }
      }
    }
    return true;
  }

  private async installDocUtils(): Promise<void> {
    try {
      await this.exec("-m", "pip", "install", "docutils");
      this.logger.log("Finished installing docutils");
    } catch (e) {
      this.logger.log("Failed to install docutils");
      vscode.window.showErrorMessage(
        "Could not install docutils. Please run `pip install docutils` to use this " +
          "extension, or check your Python path."
      );
    }
  }

  private async checkDocutilsInstall(): Promise<boolean> {
    try {
      await this.exec("-c", '"import docutils;"');
      return true;
    } catch (e) {
      return false;
    }
  }

  private async installDoc8(): Promise<void> {
    try {
      await this.exec("-m", "pip", "install", "doc8");
      this.logger.log("Finished installing doc8");
    } catch (e) {
      this.logger.log("Failed to install doc8");
      vscode.window.showErrorMessage(
        "Could not install doc8. Please run `pip install doc8` to use this " +
          "extension, or check your Python path."
      );
    }
  }

  private async checkDoc8Install(): Promise<boolean> {
    try {
      await this.exec("-c", '"import doc8.main;"');
      return true;
    } catch (e) {
      return false;
    }
  }

  private async installRstCheck(): Promise<void> {
    try {
      await this.exec("-m", "pip", "install", "rstcheck");
      this.logger.log("Finished installing rstcheck");
    } catch (e) {
      this.logger.log("Failed to install rstcheck");
      vscode.window.showErrorMessage(
        "Could not install rstcheck. Please run `pip install rstcheck` to use this " +
          "extension, or check your Python path."
      );
    }
  }

  private async checkRstCheckInstall(): Promise<boolean> {
    try {
      await this.exec("-c", '"import rstcheck;"');
      return true;
    } catch (e) {
      return false;
    }
  }

  private async installSphinx(): Promise<void> {
    try {
      await this.exec("-m", "pip", "install", "sphinx", "sphinx-autobuild");
      this.logger.log("Finished installing sphinx");
    } catch (e) {
      this.logger.log("Failed to install sphinx");
      vscode.window.showErrorMessage(
        "Could not install sphinx. Please run `pip install sphinx sphinx-autobuild` to use this " +
          "extension, or check your Python path."
      );
    }
  }

  private async checkSphinxInstall(): Promise<boolean> {
    try {
      await this.exec("-c", '"import sphinx;"');
      return true;
    } catch (e) {
      return false;
    }
  }

  private async getVersion(): Promise<void> {
    if (this.version !== null) {
      return;
    }
    const version = await this.exec(
      "-c",
      '"import sys; print(sys.version_info[0])"'
    );
    switch (Number.parseInt(version)) {
      case 2:
        this.version = 2;
        return;
      case 3:
        this.version = 3;
        return;
      default:
        throw new Error("Could not get Python version");
    }
  }

  public exec(...args: string[]): Promise<string> {
    const cmd = [this.pythonPath, ...args];
    return new Promise<string>((resolve, reject) => {
      this.logger.log(`Running cmd: ${this.pythonPath} ${args.join(" ")}`);      
      exec(
        cmd.join(" "),
        (error: ExecException | null, stdout: string, stderr: string) => {
          if (error) {
            let errorMessage: string = [
              error.name,
              error.message,
              error.stack,
              "",
              stderr.toString()
            ].join("\n");
            this.logger.log(errorMessage);
            reject(errorMessage);
          } else {
            this.logger.log("Successful exec", stdout.toString());
            resolve(stdout.toString());
          }
        }
      );
    });
  }
}
