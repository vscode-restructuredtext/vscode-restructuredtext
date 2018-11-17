import * as vscode from "vscode";
import { exec, ExecException } from "child_process";
import { Logger1 } from "./logger1";

export class Python {
  private version: 2 | 3 | null = null;
  private pythonPath = vscode.workspace
    .getConfiguration("rst", null)
    .get<string>("preview.pythonPath", "python");
  private ready: boolean = false;

  public constructor(private readonly logger: Logger1) {
    this.setup();
  }

  public isReady(): boolean {
    return this.ready;
  }

  public async awaitReady(): Promise<void> {
    return new Promise<void>((res, rej) => {
      const int = setInterval(() => {
        if (this.ready) {
          clearInterval(int);
          res();
        }
      }, 500);
    });
  }

  private async setup(): Promise<void> {
    await this.getVersion();
    if (!(await this.checkDocutilsInstall())) {
      await this.installDocutils();
    }
    this.ready = true;
  }

  private async installDocutils(): Promise<void> {
    try {
      await this.exec("-m", "pip", "install", "docutils");
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
