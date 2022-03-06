/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import * as path from 'path';

import { Logger } from '../util/logger';
import { RSTContentProvider } from './previewContentProvider';
import { disposeAll } from '../util/dispose';

import * as nls from 'vscode-nls';
import { getVisibleLine, RSTFileTopmostLineMonitor } from '../util/topmostLineMonitor';
import { RSTPreviewConfigurationManager } from './previewConfig';
import { isRSTFile } from '../util/file';
import { getExtensionPath } from '../extension';
import { Configuration } from '../util/configuration';
import { StatusBarAlignment, StatusBarItem, window } from 'vscode';
import { EsbonioClient } from '../language-server/client';

const localize = nls.loadMessageBundle();

export class RSTPreview {

	public static viewType = 'restructuredtext.preview';

	private _resource: vscode.Uri;
	private _locked: boolean;

	private readonly editor: vscode.WebviewPanel;
	private line: number | undefined = undefined;
	private readonly disposables: vscode.Disposable[] = [];
	private currentVersion?: { resource: vscode.Uri; version: number; };
	private forceUpdate = false;
	private isScrolling = false;
	private _disposed: boolean = false;
	private _statusBarItem: StatusBarItem;

	public static async revive(
		webview: vscode.WebviewPanel,
		state: any,
		contentProvider: RSTContentProvider,
		previewConfigurations: RSTPreviewConfigurationManager,
		logger: Logger,
		esbonio: EsbonioClient,
		topmostLineMonitor: RSTFileTopmostLineMonitor
	): Promise<RSTPreview> {
		const resource = vscode.Uri.parse(state.resource);
		const locked = state.locked;
		const line = state.line;

		const preview = new RSTPreview(
			webview,
			resource,
			locked,
			contentProvider,
			previewConfigurations,
			esbonio,
			topmostLineMonitor);

		preview.editor.webview.options = RSTPreview.getWebviewOptions(resource);

		if (!isNaN(line)) {
			preview.line = line;
		}
		await preview.doUpdate();
		return preview;
	}

	public static create(
		resource: vscode.Uri,
		previewColumn: vscode.ViewColumn,
		locked: boolean,
		contentProvider: RSTContentProvider,
		previewConfigurations: RSTPreviewConfigurationManager,
		logger: Logger,
		esbonio: EsbonioClient,
		topmostLineMonitor: RSTFileTopmostLineMonitor
	): RSTPreview {
		const webview = vscode.window.createWebviewPanel(
			RSTPreview.viewType,
			RSTPreview.getPreviewTitle(resource, locked),
			previewColumn, {
			enableFindWidget: true,
			...RSTPreview.getWebviewOptions(resource)
		});

		return new RSTPreview(
			webview,
			resource,
			locked,
			contentProvider,
			previewConfigurations,
			esbonio,
			topmostLineMonitor);
	}

	private constructor(
		webview: vscode.WebviewPanel,
		resource: vscode.Uri,
		locked: boolean,
		private readonly _contentProvider: RSTContentProvider,
		private readonly _previewConfigurations: RSTPreviewConfigurationManager,
		esbonio: EsbonioClient,
		topmostLineMonitor: RSTFileTopmostLineMonitor
	) {
		this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right);
		this._statusBarItem.text = '$(open-preview) Preview is loading...';

		this._resource = resource;
		this._locked = locked;
		this.editor = webview;

		this.editor.onDidDispose(() => {
			this.dispose();
		}, null, this.disposables);

		this.editor.onDidChangeViewState(e => {
			this._onDidChangeViewStateEmitter.fire(e);
		}, null, this.disposables);

		this.editor.webview.onDidReceiveMessage(e => {
			if (e.source !== this._resource.toString()) {
				return;
			}

			switch (e.type) {
				case 'command':
					vscode.commands.executeCommand(e.body.command, ...e.body.args);
					break;

				case 'revealLine':
					this.onDidScrollPreview(e.body.line);
					break;

				case 'didClick':
					this.onDidClickPreview(e.body.line);
					break;

			}
		}, null, this.disposables);

		esbonio.onBuildComplete(() => {
			this.refresh()
		  });

		// vscode.workspace.onDidChangeTextDocument(event => {
		// 	if (this.isPreviewOf(event.document.uri)) {
		// 		this.refresh();
		// 	}
		// }, null, this.disposables);

		topmostLineMonitor.onDidChangeTopmostLine(event => {
			if (this.isPreviewOf(event.resource)) {
				this.updateForView(event.resource, event.line);
			}
		}, null, this.disposables);

		vscode.window.onDidChangeTextEditorSelection(event => {
			if (this.isPreviewOf(event.textEditor.document.uri)) {
				this.postMessage({
					type: 'onDidChangeTextEditorSelection',
					line: event.selections[0].active.line,
					source: this.resource.toString()
				});
			}
		}, null, this.disposables);

		vscode.window.onDidChangeActiveTextEditor(editor => {
			if (editor && isRSTFile(editor.document) && !this._locked) {
				this.update(editor.document.uri);
			}
		}, null, this.disposables);
	}

	private readonly _onDisposeEmitter = new vscode.EventEmitter<void>();
	public readonly onDispose = this._onDisposeEmitter.event;

	private readonly _onDidChangeViewStateEmitter = new vscode.EventEmitter<vscode.WebviewPanelOnDidChangeViewStateEvent>();
	public readonly onDidChangeViewState = this._onDidChangeViewStateEmitter.event;

	public get resource(): vscode.Uri {
		return this._resource;
	}

	public get state() {
		return {
			resource: this.resource.toString(),
			locked: this._locked,
			line: this.line
		};
	}

	public dispose() {
		if (this._disposed) {
			return;
		}

		this._disposed = true;
		this._onDisposeEmitter.fire();

		this._onDisposeEmitter.dispose();
		this._onDidChangeViewStateEmitter.dispose();
		this.editor.dispose();

		disposeAll(this.disposables);
	}

	public update(resource: vscode.Uri) {
		const editor = vscode.window.activeTextEditor;
		if (editor && editor.document.uri.fsPath === resource.fsPath) {
			this.line = getVisibleLine(editor);
		}

		this._resource = resource;
		this.doUpdate();
	}

	public refresh() {
		this.forceUpdate = true;
		this.update(this._resource);
	}

	public updateConfiguration() {
		if (this._previewConfigurations.hasConfigurationChanged(this._resource)) {
			this.refresh();
		}
	}

	public get position(): vscode.ViewColumn | undefined {
		return this.editor.viewColumn;
	}

	public matchesResource(
		otherResource: vscode.Uri,
		otherPosition: vscode.ViewColumn | undefined,
		otherLocked: boolean
	): boolean {
		if (this.position !== otherPosition) {
			return false;
		}

		if (this._locked) {
			return otherLocked && this.isPreviewOf(otherResource);
		} else {
			return !otherLocked;
		}
	}

	public matches(otherPreview: RSTPreview): boolean {
		return this.matchesResource(otherPreview._resource, otherPreview.position, otherPreview._locked);
	}

	public reveal(viewColumn: vscode.ViewColumn) {
		this.editor.reveal(viewColumn);
	}

	public toggleLock() {
		this._locked = !this._locked;
		this.editor.title = RSTPreview.getPreviewTitle(this._resource, this._locked);
	}

	private get iconPath() {
		const root = path.join(getExtensionPath(), 'media');
		return {
			light: vscode.Uri.file(path.join(root, 'Preview.svg')),
			dark: vscode.Uri.file(path.join(root, 'Preview_inverse.svg'))
		};
	}

	private isPreviewOf(resource: vscode.Uri): boolean {
		return this._resource.fsPath === resource.fsPath;
	}

	private static getPreviewTitle(resource: vscode.Uri, locked: boolean): string {
		return locked
			? localize('lockedPreviewTitle', '[Preview] {0}', path.basename(resource.fsPath))
			: localize('previewTitle', 'Preview {0}', path.basename(resource.fsPath));
	}

	private updateForView(resource: vscode.Uri, topLine: number | undefined) {
		if (!this.isPreviewOf(resource)) {
			return;
		}

		if (this.isScrolling) {
			this.isScrolling = false;
			return;
		}

		if (typeof topLine === 'number') {
			this.line = topLine;
			this.postMessage({
				type: 'updateView',
				line: topLine,
				source: resource.toString()
			});
		}
	}

	private postMessage(msg: any) {
		if (!this._disposed) {
			this.editor.webview.postMessage(msg);
		}
	}

	private async doUpdate(): Promise<void> {
		const resource = this._resource;

		const document = await vscode.workspace.openTextDocument(resource);
		if (!this.forceUpdate && this.currentVersion && this.currentVersion.resource.fsPath === resource.fsPath && this.currentVersion.version === document.version) {
			if (this.line) {
				this.updateForView(resource, this.line);
			}
			return;
		}
		this.forceUpdate = false;

		this.currentVersion = { resource, version: document.version };
		this._statusBarItem.show();
		const content: string = await this._contentProvider.provideTextDocumentContent(document, this._previewConfigurations, this.editor.webview, this.line, this.state);
		if (this._resource === resource) {
			this.editor.title = RSTPreview.getPreviewTitle(this._resource, this._locked);
			this.editor.iconPath = this.iconPath;
			this.editor.webview.options = RSTPreview.getWebviewOptions(resource);
			this.editor.webview.html = content;
			this._statusBarItem.hide();
		}
	}

	private static getWebviewOptions(
		resource: vscode.Uri
	): vscode.WebviewOptions {
		return {
			enableScripts: true,
			enableCommandUris: true,
			localResourceRoots: RSTPreview.getLocalResourceRoots(resource)
		};
	}

	private static getLocalResourceRoots(
		resource: vscode.Uri
	): vscode.Uri[] {
		const baseRoots: vscode.Uri[] = [vscode.Uri.file(getExtensionPath() + "/media")];

		const folder = vscode.workspace.getWorkspaceFolder(resource);
		if (folder) {
			return baseRoots.concat(folder.uri);
		}

		if (!resource.scheme || resource.scheme === 'file') {
			return baseRoots.concat(vscode.Uri.file(path.dirname(resource.fsPath)));
		}

		return baseRoots;
	}

	private onDidScrollPreview(line: number) {
		this.line = line;
		for (const editor of vscode.window.visibleTextEditors) {
			if (!this.isPreviewOf(editor.document.uri)) {
				continue;
			}

			this.isScrolling = true;
			const sourceLine = Math.floor(line);
			const fraction = line - sourceLine;
			const text = editor.document.lineAt(sourceLine).text;
			const start = Math.floor(fraction * text.length);
			editor.revealRange(
				new vscode.Range(sourceLine, start, sourceLine + 1, 0),
				vscode.TextEditorRevealType.AtTop);
		}
	}

	private async onDidClickPreview(line: number): Promise<void> {
		for (const visibleEditor of vscode.window.visibleTextEditors) {
			if (this.isPreviewOf(visibleEditor.document.uri)) {
				const editor = await vscode.window.showTextDocument(visibleEditor.document, visibleEditor.viewColumn);
				const position = new vscode.Position(line, 0);
				editor.selection = new vscode.Selection(position, position);
				return;
			}
		}

		vscode.workspace.openTextDocument(this._resource).then(vscode.window.showTextDocument);
	}
}

export interface PreviewSettings {
	readonly resourceColumn: vscode.ViewColumn;
	readonly previewColumn: vscode.ViewColumn;
	readonly locked: boolean;
}
