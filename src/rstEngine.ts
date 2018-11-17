import { TextDocument } from "vscode";
import * as path from "path";
import { Python } from "./python";
import { Logger1 } from "./logger1";

export class RSTEngine {
  public constructor(
    private readonly python: Python,
    private readonly logger: Logger1
  ) {}

  private errorSnippet(error: string): string {
    return `<html><body>${error}</body></html>`;
  }

  public async compile(fileName: string): Promise<string> {
    this.logger.log(`Compiling file: ${fileName}`);
    return this.python.exec(
      path.join(__dirname, "..", "python", "preview.py"),
      fileName
    );
  }

  public async preview(doc: TextDocument): Promise<string> {
    try {
      return this.compile(doc.fileName);
    } catch (e) {
      return this.errorSnippet(e.toString());
    }
  }
}
