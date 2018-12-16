/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { join } from 'path';

export class RSTPreviewConfiguration {
	public static getForResource(resource: vscode.Uri) {
		return new RSTPreviewConfiguration(resource);
	}

	public readonly scrollBeyondLastLine: boolean;
	public readonly wordWrap: boolean;
	public readonly doubleClickToSwitchToEditor: boolean;
	public readonly scrollEditorWithPreview: boolean;
	public readonly scrollPreviewWithEditor: boolean;
	public readonly rstEditorSelection: boolean;

	public readonly lineHeight: number;
	public readonly fontSize: number;
	public readonly fontFamily: string | undefined;
	public readonly styles: string[];
	public readonly baseStyles: string[];

	private constructor(resource: vscode.Uri) {
		const editorConfig = vscode.workspace.getConfiguration('editor', resource);
		const rstConfig = vscode.workspace.getConfiguration('restructuredtext', resource);
		const rstEditorConfig = vscode.workspace.getConfiguration('[rst]', resource);

		this.scrollBeyondLastLine = editorConfig.get<boolean>('scrollBeyondLastLine', false);

		this.wordWrap = editorConfig.get<string>('wordWrap', 'off') !== 'off';
		if (rstEditorConfig && rstEditorConfig['editor.wordWrap']) {
			this.wordWrap = rstEditorConfig['editor.wordWrap'] !== 'off';
		}

		this.scrollPreviewWithEditor = !!rstConfig.get<boolean>('preview.scrollPreviewWithEditor', true);
		this.scrollEditorWithPreview = !!rstConfig.get<boolean>('preview.scrollEditorWithPreview', true);
		this.lineBreaks = !!rstConfig.get<boolean>('preview.breaks', false);
		this.doubleClickToSwitchToEditor = !!rstConfig.get<boolean>('preview.doubleClickToSwitchToEditor', true);
		this.rstEditorSelection = !!rstConfig.get<boolean>('preview.markEditorSelection', true);

		this.fontFamily = rstConfig.get<string | undefined>('preview.fontFamily', undefined);
		this.fontSize = Math.max(8, +rstConfig.get<number>('preview.fontSize', NaN));
		this.lineHeight = Math.max(0.6, +rstConfig.get<number>('preview.lineHeight', NaN));

		this.baseStyles = [
			join(__dirname, "..", "..", "media", "basic.css"),
			join(__dirname, "..", "..", "media", "default.css"),
			join(__dirname, "..", "..", "media", "rst.css")
		];

		this.styles = rstConfig.get<string[]>('styles', []);
	}

	public isEqualTo(otherConfig: RSTPreviewConfiguration) {
		for (let key in this) {
			if (this.hasOwnProperty(key) && key !== 'styles') {
				if (this[key] !== otherConfig[key]) {
					return false;
				}
			}
		}

		// Check styles
		if (this.styles.length !== otherConfig.styles.length) {
			return false;
		}
		for (let i = 0; i < this.styles.length; ++i) {
			if (this.styles[i] !== otherConfig.styles[i]) {
				return false;
			}
		}

		return true;
	}

	[key: string]: any;
}

export class RSTPreviewConfigurationManager {
	private readonly previewConfigurationsForWorkspaces = new Map<string, RSTPreviewConfiguration>();

	public loadAndCacheConfiguration(
		resource: vscode.Uri
	): RSTPreviewConfiguration {
		const config = RSTPreviewConfiguration.getForResource(resource);
		this.previewConfigurationsForWorkspaces.set(this.getKey(resource), config);
		return config;
	}

	public hasConfigurationChanged(
		resource: vscode.Uri
	): boolean {
		const key = this.getKey(resource);
		const currentConfig = this.previewConfigurationsForWorkspaces.get(key);
		const newConfig = RSTPreviewConfiguration.getForResource(resource);
		return (!currentConfig || !currentConfig.isEqualTo(newConfig));
	}

	private getKey(
		resource: vscode.Uri
	): string {
		const folder = vscode.workspace.getWorkspaceFolder(resource);
		return folder ? folder.uri.toString() : '';
	}
}
