import * as vscode from "vscode";
import { exec, ExecException, spawn } from "child_process";
import { Logger } from "./logger";
import { Configuration } from './features/utils/configuration';
import { fileExists } from './common';
import { Uri } from 'vscode';


export class Python {
  private version: 2 | 3 | null = null;
  private pythonPath: string;
  private ready: boolean = false;
  public setupPromise: Promise<void>
  
  public constructor(private readonly logger: Logger) {
  }

  public isReady(): boolean {
    return this.ready;
  }

  private async _setup(resource: Uri) {
    const path = Configuration.getPythonPath(resource);
    if (path) {
      this.pythonPath = path;
      await this.getVersion();
      if (Configuration.getConfPath(resource) === '') {
        if (!Configuration.getDocUtilDisabled() && !(await this.checkDocutilsInstall())) {
          var choice = await vscode.window.showInformationMessage("Preview engine docutil is not installed.", "Install", "No now", "Do not show again");
          if (choice === "Install") {
            this.logger.log("Started to install docutils...");
            await this.installDocUtils();
          } else if (choice === "Do not show again") {
            this.logger.log("Disabled docutil engine.");
            await Configuration.setDocUtilDisabled();
          }
        }
      } else {
        const sphinx = Configuration.getSphinxPath(resource);
        if (!Configuration.getSphinxDisabled() && !(await this.checkSphinxInstall() || (sphinx != null && await fileExists(sphinx)))) {
          var choice = await vscode.window.showInformationMessage("Preview engine sphinx is not installed.", "Install", "Not now", "Do not show again");
          if (choice === "Install") {
            this.logger.log("Started to install sphinx...");
            await this.installSphinx();
          } else if (choice === "Do not show again") {
            this.logger.log("Disabled sphinx engine.");
            await Configuration.setSphinxDisabled();
          }
        }
      }
    
      const doc8 = Configuration.getLinterPath(resource);
      if (!Configuration.getLinterDisabled() && !(await this.checkDoc8Install() || (doc8 != null && await fileExists(doc8)))) {
        var choice = await vscode.window.showInformationMessage("Linter doc8 is not installed.", "Install", "Not now", "Do not show again");
        if (choice === "Install") {
          this.logger.log("Started to install doc8...");
          await this.installDoc8();
        } else if (choice === "Do not show again") {
          this.logger.log("Disabled linter.");
          await Configuration.setLinterDisabled();
        }
      }
    } else {
      this.logger.log("Cannot find Python.");
      vscode.window.showErrorMessage("Please review Python installation on this machine before using this extension.");
    }
    this.ready = true
  }
  public setup(resource: Uri) {
    return this.setupPromise || (this.setupPromise = this._setup(resource))
  }

  private async installDocUtils(): Promise<void> {
    try {
      await this.exec("-m", "pip", "install", "docutils");
      this.logger.log("Finished installing docutils");
    } catch (e) {
      this.logger.log("Failed to install docutils");
      vscode.window.showErrorMessage(
        "Could not install docutils. Please run `pip install docutils` to use this " +
          "extension, or check your python path."
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
          "extension, or check your python path."
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

  private async installSphinx(): Promise<void> {
    try {
      await this.exec("-m", "pip", "install", "sphinx", "sphinx-autobuild");
      this.logger.log("Finished installing sphinx");
    } catch (e) {
      this.logger.log("Failed to install sphinx");
      vscode.window.showErrorMessage(
        "Could not install sphinx. Please run `pip install sphinx sphinx-autobuild` to use this " +
          "extension, or check your python path."
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
        throw new Error("Could not get python version");
    }
  }

  public spawn(...args: string[]) {
    this.logger.log(`Spawning child: ${this.pythonPath} ${args.join(" ")}`); 
    return spawn(this.pythonPath, args)
  }

  public exec(...args: string[]): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.logger.log(`Running cmd: ${this.pythonPath} ${args.join(" ")}`);      
      exec(
        `${this.pythonPath} ${args.join(" ")}`,
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
