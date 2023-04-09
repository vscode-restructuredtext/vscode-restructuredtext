import * as vscode from 'vscode';
import {EsbonioClient} from '../language-server/client';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {injectable} from 'inversify';

@injectable()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class PreviewContext {
    constructor(
        public readonly esbonio: EsbonioClient,
        public readonly extensionContext: vscode.ExtensionContext
    ) {}
}
