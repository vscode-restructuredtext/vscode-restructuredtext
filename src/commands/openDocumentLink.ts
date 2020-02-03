/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import * as path from 'path';

import { Command } from '../commandManager';
import { isRSTFile } from '../util/file';


export interface OpenDocumentLinkArgs {
	path: string;
	fragment: string;
}

export class OpenDocumentLinkCommand implements Command {
	private static readonly id = '_rst.openDocumentLink';
	public readonly id = OpenDocumentLinkCommand.id;

	public static createCommandUri(
		path: string,
		fragment: string
	): vscode.Uri {
		return vscode.Uri.parse(`command:${OpenDocumentLinkCommand.id}?${encodeURIComponent(JSON.stringify({ path, fragment }))}`);
	}

	public constructor(
	) { }

	public execute(args: OpenDocumentLinkArgs) {
		const p = decodeURIComponent(args.path);
		return this.tryOpen(p, args).catch(() => {
			if (path.extname(p) === '') {
				return this.tryOpen(p + '.md', args);
			}
			const resource = vscode.Uri.file(p);
			return Promise.resolve(void 0)
				.then(() => vscode.commands.executeCommand('vscode.open', resource))
				.then(() => void 0);
		});
	}

	private async tryOpen(path: string, args: OpenDocumentLinkArgs) {
		const resource = vscode.Uri.file(path);
		if (vscode.window.activeTextEditor && isRSTFile(vscode.window.activeTextEditor.document) && vscode.window.activeTextEditor.document.uri.fsPath === resource.fsPath) {
			return this.tryRevealLine(vscode.window.activeTextEditor, args.fragment);
		} else {
			return vscode.workspace.openTextDocument(resource)
				.then(vscode.window.showTextDocument)
				.then(editor => this.tryRevealLine(editor, args.fragment));
		}
	}

	private async tryRevealLine(editor: vscode.TextEditor, fragment?: string) {
		if (editor && fragment) {
			const lineNumberFragment = fragment.match(/^L(\d+)$/i);
			if (lineNumberFragment) {
				const line = +lineNumberFragment[1] - 1;
				if (!isNaN(line)) {
					return editor.revealRange(new vscode.Range(line, 0, line, 0), vscode.TextEditorRevealType.AtTop);
				}
			}
		}
	}
}
