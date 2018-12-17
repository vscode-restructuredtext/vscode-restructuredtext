import * as vscode from "vscode";
import { exec, ExecException } from "child_process";
import { Logger } from "./logger";
import { Configuration } from './features/utils/configuration';
import { fileExists } from './common';
import { Uri } from 'vscode';

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
    this.pythonPath = Configuration.getPythonPath(resource);
    await this.getVersion();
    if (!(await this.checkDocutilsInstall())) {
      vscode.window.showWarningMessage("Previewer docutils cannot be found.");
    }

    const sphinx = Configuration.getSphinxPath(resource);
    if (!(await this.checkSphinxInstall() || (sphinx != null && await fileExists(sphinx)))) {
      vscode.window.showWarningMessage("Previewer sphinx-build cannot be found.");
    }

    const doc8 = Configuration.getLinterPath(resource);
    if (!(await this.checkDoc8Install() || (doc8 != null && await fileExists(doc8)))) {
      vscode.window.showWarningMessage("Linter doc8 cannot be found.");
    }
    this.ready = true;
  }

  private async checkDocutilsInstall(): Promise<boolean> {
    try {
      await this.exec("-c", '"import docutils;"');
      return true;
    } catch (e) {
      return false;
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

  public exec(...args: string[]): Promise<string> {
    const cmd = [this.pythonPath, ...args];
    return new Promise<string>((resolve, reject) => {
      this.logger.log(`Running cmd: python ${args.join(" ")}`);
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
