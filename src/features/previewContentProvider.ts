/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import * as path from 'path';

import * as nls from 'vscode-nls';
const localize = nls.loadMessageBundle();

import { Logger } from '../logger';
import { ContentSecurityPolicyArbiter, RSTPreviewSecurityLevel } from '../security';
import { RSTPreviewConfigurationManager, RSTPreviewConfiguration } from './previewConfig';
import { RSTEngine } from '../rstEngine';

/**
 * Strings used inside the html preview.
 *
 * Stored here and then injected in the preview so that they
 * can be localized using our normal localization process.
 */
const previewStrings = {
	cspAlertMessageText: localize(
		'preview.securityMessage.text',
		'Some content has been disabled in this document'),

	cspAlertMessageTitle: localize(
		'preview.securityMessage.title',
		'Potentially unsafe or insecure content has been disabled in the html preview. Change the HTML preview security setting to allow insecure content or enable scripts'),

	cspAlertMessageLabel: localize(
		'preview.securityMessage.label',
		'Content Disabled Security Warning')
};

export class RSTContentProvider {
	constructor(
		private readonly context: vscode.ExtensionContext,
		private readonly cspArbiter: ContentSecurityPolicyArbiter,
		private readonly engine: RSTEngine,
		private readonly logger: Logger
	) { }

	private readonly TAG_RegEx = /^\s*?\<(p|h[1-6]|img|code|blockquote|li)((\s+.*?)(class="(.*?)")(.*?\>)|\>|\>|\/\>|\s+.*?\>)/;

	public async provideTextDocumentContent(
		rstDocument: vscode.TextDocument,
		previewConfigurations: RSTPreviewConfigurationManager,
<<<<<<< HEAD
=======
		webview: vscode.Webview,
>>>>>>> upstream/master
		initialLine: number | undefined = undefined,
		state?: any
	): Promise<string> {
		const sourceUri = rstDocument.uri;
		const config = previewConfigurations.loadAndCacheConfiguration(sourceUri);
		const initialData = {
			source: sourceUri.toString(),
			line: initialLine,
			lineCount: rstDocument.lineCount,
			scrollPreviewWithEditor: config.scrollPreviewWithEditor,
			scrollEditorWithPreview: config.scrollEditorWithPreview,
			doubleClickToSwitchToEditor: config.doubleClickToSwitchToEditor,
			disableSecurityWarnings: this.cspArbiter.shouldDisableSecurityWarnings()
		};

<<<<<<< HEAD
		this.logger.log('provideTextDocumentContent', initialData);

		const body = await this.engine.preview(rstDocument);
		const useSphinx = body.search('</head>') > -1;
		// Content Security Policy
		const nonce = new Date().getTime() + '' + new Date().getMilliseconds();
		const csp = this.getCspForResource(sourceUri, nonce, useSphinx);
		
=======
		const body = await this.engine.preview(rstDocument, webview);
		const useSphinx = body.search('</head>') > -1;
		// Content Security Policy
		const nonce = new Date().getTime() + '' + new Date().getMilliseconds();
		const csp = this.getCspForResource(sourceUri, nonce, useSphinx, webview);

>>>>>>> upstream/master
		if (useSphinx) {
			// sphinx based preview.
			let elementCount: number = 0;
			let canStart: boolean = false;
<<<<<<< HEAD
			const parsedDoc = body.split(/\r?\n/).map((l,i) => {
=======
			const parsedDoc = body.split(/\r?\n/).map((l) => {
>>>>>>> upstream/master
				if (l.search('<div itemprop="articleBody">') > -1) {
					canStart = true;
				}
				if (!canStart) {
					return l;
<<<<<<< HEAD
				}				
=======
				}
>>>>>>> upstream/master
				return l.replace(this.TAG_RegEx, (
					match: string, p1: string, p2: string, p3: string, 
					p4: string, p5: string, p6: string, offset: number) => {
					elementCount++;
<<<<<<< HEAD
					return typeof p5 !== "string" ? 
					`<${p1} class="code-line" data-line="${elementCount}" ${p2}` : 
					`<${p1} ${p3} class="${p5} code-line" data-line="${elementCount}" ${p6}`;
				});
			}
			).join("\n");
=======
					return typeof p5 !== 'string'
                        ? `<${p1} class="code-line" data-line="${elementCount}" ${p2}`
                        : `<${p1} ${p3} class="${p5} code-line" data-line="${elementCount}" ${p6}`;
				});
			}
			).join('\n');
>>>>>>> upstream/master
			const newHead = parsedDoc.replace('</head>', `
			<meta id="vscode-rst-preview-data"
			data-settings="${JSON.stringify(initialData).replace(/"/g, '&quot;')}"
			data-strings="${JSON.stringify(previewStrings).replace(/"/g, '&quot;')}"
			data-state="${JSON.stringify(state || {}).replace(/"/g, '&quot;')}">
<<<<<<< HEAD
		<script src="${this.extensionResourcePath('pre.js')}" nonce="${nonce}"></script>
		<script src="${this.extensionResourcePath('index.js')}" nonce="${nonce}"></script>
		<base href="${rstDocument.uri.with({ scheme: 'vscode-resource' }).toString(true)}">
		</head>
			`);
			const newBody = newHead.replace('<body class="', 
=======
		<script src="${this.extensionResourcePath('pre.js', webview)}" nonce="${nonce}"></script>
		<script src="${this.extensionResourcePath('index.js', webview)}" nonce="${nonce}"></script>
		<base href="${webview.asWebviewUri(rstDocument.uri)}">
		</head>
			`);
			const newBody = newHead.replace('<body class="',
>>>>>>> upstream/master
			`<body class="vscode-body ${config.scrollBeyondLastLine ? 'scrollBeyondLastLine' : ''} ${config.wordWrap ? 'wordWrap' : ''} ${config.rstEditorSelection ? 'showEditorSelection' : ''} `);
			const newAll = newBody.replace('</body>', `
			    <div class="code-line" data-line="${rstDocument.lineCount}"></div>
			</body>
			`);
<<<<<<< HEAD
        	this.logger.log("Document line count: " + rstDocument.lineCount + "; element count: " + elementCount);
			if (rstDocument.lineCount < elementCount) {
				this.logger.log("WARN: documentl line count is less than element count.");
			}
			return newAll;
		} else {		
			const parsedDoc = body.split(/\r?\n/).map((l,i) => 
				l.replace(this.TAG_RegEx, (
					match: string, p1: string, p2: string, p3: string, 
					p4: string, p5: string, p6: string, offset: number) => 
				typeof p5 !== "string" ? 
				`<${p1} class="code-line" data-line="${i+1}" ${p2}` : 
				`<${p1} ${p3} class="${p5} code-line" data-line="${i+1}" ${p6}`)
			).join("\n");
=======
        	this.logger.log("[preview] Document line count: " + rstDocument.lineCount + "; element count: " + elementCount);
			if (rstDocument.lineCount < elementCount) {
				this.logger.log("[preview] WARN: documentl line count is less than element count.");
			}
			return newAll;
		} else {
			const parsedDoc = body.split(/\r?\n/).map((l, i) =>
				l.replace(this.TAG_RegEx, (
					match: string, p1: string, p2: string, p3: string,
					p4: string, p5: string, p6: string, offset: number) =>
				typeof p5 !== 'string'
                    ? `<${p1} class="code-line" data-line="${i + 1}" ${p2}`
                    : `<${p1} ${p3} class="${p5} code-line" data-line="${i + 1}" ${p6}`)
			).join('\n');
>>>>>>> upstream/master
			return `<!DOCTYPE html>
				<html>
				<head>
					<meta http-equiv="Content-type" content="text/html;charset=UTF-8">
					${csp}
					<meta id="vscode-rst-preview-data"
						data-settings="${JSON.stringify(initialData).replace(/"/g, '&quot;')}"
						data-strings="${JSON.stringify(previewStrings).replace(/"/g, '&quot;')}"
						data-state="${JSON.stringify(state || {}).replace(/"/g, '&quot;')}">
<<<<<<< HEAD
					<script src="${this.extensionResourcePath('pre.js')}" nonce="${nonce}"></script>
					<script src="${this.extensionResourcePath('index.js')}" nonce="${nonce}"></script>
					${this.getStyles(sourceUri, nonce, config)}
					<base href="${rstDocument.uri.with({ scheme: 'vscode-resource' }).toString(true)}">
=======
					<script src="${this.extensionResourcePath('pre.js', webview)}" nonce="${nonce}"></script>
					<script src="${this.extensionResourcePath('index.js', webview)}" nonce="${nonce}"></script>
					${this.getStyles(sourceUri, nonce, config, webview)}
					<base href="${webview.asWebviewUri(rstDocument.uri)}">
>>>>>>> upstream/master
				</head>
				<body class="vscode-body ${config.scrollBeyondLastLine ? 'scrollBeyondLastLine' : ''} ${config.wordWrap ? 'wordWrap' : ''} ${config.rstEditorSelection ? 'showEditorSelection' : ''}">
					${parsedDoc}
					<div class="code-line" data-line="${rstDocument.lineCount}"></div>
				</body>
				</html>`;
		}
	}

<<<<<<< HEAD
	private extensionResourcePath(mediaFile: string): string {
		return vscode.Uri.file(this.context.asAbsolutePath(path.join('media', mediaFile)))
			.with({ scheme: 'vscode-resource' })
			.toString();
	}

	private fixHref(resource: vscode.Uri, href: string): string {
=======
	private extensionResourcePath(mediaFile: string, webview: vscode.Webview): string {
		return webview.asWebviewUri(vscode.Uri.file(this.context.asAbsolutePath(path.join('media', mediaFile))))
			.toString();
	}

	private fixHref(resource: vscode.Uri, href: string, webview: vscode.Webview): string {
>>>>>>> upstream/master
		if (!href) {
			return href;
		}

		// Use href if it is already an URL
		const hrefUri = vscode.Uri.parse(href);
		if (['http', 'https'].indexOf(hrefUri.scheme) >= 0) {
			return hrefUri.toString();
		}

		// Use href as file URI if it is absolute
		if (path.isAbsolute(href) || hrefUri.scheme === 'file') {
<<<<<<< HEAD
			return vscode.Uri.file(href)
				.with({ scheme: 'vscode-resource' })
=======
			return webview.asWebviewUri(vscode.Uri.file(href))
>>>>>>> upstream/master
				.toString();
		}

		// Use a workspace relative path if there is a workspace
<<<<<<< HEAD
		let root = vscode.workspace.getWorkspaceFolder(resource);
		if (root) {
			return vscode.Uri.file(path.join(root.uri.fsPath, href))
				.with({ scheme: 'vscode-resource' })
=======
		const root = vscode.workspace.getWorkspaceFolder(resource);
		if (root) {
			return webview.asWebviewUri(vscode.Uri.file(path.join(root.uri.fsPath, href)))
>>>>>>> upstream/master
				.toString();
		}

		// Otherwise look relative to the html file
<<<<<<< HEAD
		return vscode.Uri.file(path.join(path.dirname(resource.fsPath), href))
			.with({ scheme: 'vscode-resource' })
			.toString();
	}

	private computeCustomStyleSheetIncludes(resource: vscode.Uri, config: RSTPreviewConfiguration): string {
		if (Array.isArray(config.styles)) {
			return config.styles.map(style => {
				return `<link rel="stylesheet" class="code-user-style" data-source="${style.replace(/"/g, '&quot;')}" href="${this.fixHref(resource, style)}" type="text/css" media="screen">`;
=======
		return webview.asWebviewUri(vscode.Uri.file(path.join(path.dirname(resource.fsPath), href)))
			.toString();
	}

	private computeCustomStyleSheetIncludes(resource: vscode.Uri, config: RSTPreviewConfiguration, webview: vscode.Webview): string {
		if (Array.isArray(config.styles)) {
			return config.styles.map((style) => {
				return `<link rel="stylesheet" class="code-user-style" data-source="${style.replace(/"/g, '&quot;')}" href="${this.fixHref(resource, style, webview)}" type="text/css" media="screen">`;
>>>>>>> upstream/master
			}).join('\n');
		}
		return '';
	}

	private getSettingsOverrideStyles(nonce: string, config: RSTPreviewConfiguration): string {
		return `<style nonce="${nonce}">
			body {
				${config.fontFamily ? `font-family: ${config.fontFamily};` : ''}
				${isNaN(config.fontSize) ? '' : `font-size: ${config.fontSize}px;`}
				${isNaN(config.lineHeight) ? '' : `line-height: ${config.lineHeight};`}
			}
		</style>`;
	}

<<<<<<< HEAD
	private getStyles(resource: vscode.Uri, nonce: string, config: RSTPreviewConfiguration): string {
		const fix = (href: string) =>
		  vscode.Uri.file(href)
			.with({ scheme: "vscode-resource" })
			.toString();
		const baseStyles = config.baseStyles
		  .map(
			href => `<link rel="stylesheet" type="text/css" href="${fix(href)}">`
		  )
		  .join("\n");

		return `${baseStyles}
			${this.getSettingsOverrideStyles(nonce, config)}
			${this.computeCustomStyleSheetIncludes(resource, config)}`;
	}

	private getCspForResource(resource: vscode.Uri, nonce: string, useSphinx: boolean): string {
=======
	private getStyles(resource: vscode.Uri, nonce: string, config: RSTPreviewConfiguration, webview: vscode.Webview): string {
		const fix = (href: string) =>
		  webview.asWebviewUri(vscode.Uri.file(href))
			.toString();
		const baseStyles = config.baseStyles
		  .map(
			(href) => `<link rel="stylesheet" type="text/css" href="${fix(href)}">`
		  )
		  .join('\n');

		return `${baseStyles}
			${this.getSettingsOverrideStyles(nonce, config)}
			${this.computeCustomStyleSheetIncludes(resource, config, webview)}`;
	}

	private getCspForResource(resource: vscode.Uri, nonce: string, useSphinx: boolean, webview: vscode.Webview): string {
>>>>>>> upstream/master
		let securityLevel = this.cspArbiter.getSecurityLevelForResource(resource);
		if (useSphinx) {
			securityLevel = RSTPreviewSecurityLevel.AllowScriptsAndAllContent;
		}
		switch (securityLevel) {
			case RSTPreviewSecurityLevel.AllowInsecureContent:
<<<<<<< HEAD
				return `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src vscode-resource: http: https: data:; media-src vscode-resource: http: https: data:; script-src 'nonce-${nonce}'; style-src vscode-resource: 'unsafe-inline' http: https: data:; font-src vscode-resource: http: https: data:;">`;

			case RSTPreviewSecurityLevel.AllowInsecureLocalContent:
				return `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src vscode-resource: https: data: http://localhost:* http://127.0.0.1:*; media-src vscode-resource: https: data: http://localhost:* http://127.0.0.1:*; script-src 'nonce-${nonce}'; style-src vscode-resource: 'unsafe-inline' https: data: http://localhost:* http://127.0.0.1:*; font-src vscode-resource: https: data: http://localhost:* http://127.0.0.1:*;">`;
=======
				return `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} http: https: data:; media-src ${webview.cspSource} http: https: data:; script-src 'nonce-${nonce}'; style-src ${webview.cspSource} 'unsafe-inline' http: https: data:; font-src ${webview.cspSource} http: https: data:;">`;

			case RSTPreviewSecurityLevel.AllowInsecureLocalContent:
				return `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https: data: http://localhost:* http://127.0.0.1:*; media-src ${webview.cspSource} https: data: http://localhost:* http://127.0.0.1:*; script-src 'nonce-${nonce}'; style-src ${webview.cspSource} 'unsafe-inline' https: data: http://localhost:* http://127.0.0.1:*; font-src ${webview.cspSource} https: data: http://localhost:* http://127.0.0.1:*;">`;
>>>>>>> upstream/master

			case RSTPreviewSecurityLevel.AllowScriptsAndAllContent:
				return '';

			case RSTPreviewSecurityLevel.Strict:
			default:
<<<<<<< HEAD
				return `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src vscode-resource: https: data:; media-src vscode-resource: https: data:; script-src 'nonce-${nonce}'; style-src vscode-resource: 'unsafe-inline' https: data:; font-src vscode-resource: https: data:;">`;
=======
				return `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https: data:; media-src ${webview.cspSource} https: data:; script-src 'nonce-${nonce}'; style-src ${webview.cspSource} 'unsafe-inline' https: data:; font-src ${webview.cspSource} https: data:;">`;
>>>>>>> upstream/master
		}
	}
}
