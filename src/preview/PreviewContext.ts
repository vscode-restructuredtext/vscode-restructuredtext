import * as vscode from "vscode";
import { EsbonioClient } from "../language-server/client";
import { injectable } from "inversify";


@injectable()
export class PreviewContext {
  constructor(
    public readonly esbonio: EsbonioClient,
    public readonly extensionContext: vscode.ExtensionContext,
  ) {
  }
}
