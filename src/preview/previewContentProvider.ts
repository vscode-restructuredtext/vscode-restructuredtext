/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import * as path from 'path';

import * as nls from 'vscode-nls';
const localize = nls.loadMessageBundle();

import {Logger} from '../util/logger';
import {
  ContentSecurityPolicyArbiter,
  RSTPreviewSecurityLevel,
} from '../util/security';
import {
  RSTPreviewConfigurationManager,
  RSTPreviewConfiguration,
} from './previewConfig';
import {RSTEngine} from './rstEngine';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {inject, injectable, named} from 'inversify';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {NAMES, TYPES} from '../types';
import {PreviewContext} from './PreviewContext';

/**
 * Strings used inside the html preview.
 *
 * Stored here and then injected in the preview so that they
 * can be localized using our normal localization process.
 */
const previewStrings = {
  cspAlertMessageText: localize(
    'preview.securityMessage.text',
    'Some content has been disabled in this document'
  ),

  cspAlertMessageTitle: localize(
    'preview.securityMessage.title',
    'Potentially unsafe or insecure content has been disabled in the html preview. Change the HTML preview security setting to allow insecure content or enable scripts'
  ),

  cspAlertMessageLabel: localize(
    'preview.securityMessage.label',
    'Content Disabled Security Warning'
  ),
};

@injectable()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class RSTContentProvider {
  constructor(
    @inject(TYPES.Policy)
    private readonly cspArbiter: ContentSecurityPolicyArbiter,
    @inject(TYPES.RstEngine) private readonly engine: RSTEngine,
    @inject(TYPES.Logger)
    @named(NAMES.Main)
    private readonly logger: Logger,
    @inject(TYPES.PreviewContext) private readonly context: PreviewContext
  ) {}

  private readonly TAG_RegEx =
    /^\s*?<(p|h[1-6]|img|code|blockquote|li)((\s+.*?)(class="(.*?)")(.*?>)|>|>|\/>|\s+.*?>)/;

  public async provideTextDocumentContent(
    rstDocument: vscode.TextDocument,
    previewConfigurations: RSTPreviewConfigurationManager,
    webview: vscode.Webview,
    initialLine: number | undefined = undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      disableSecurityWarnings: this.cspArbiter.shouldDisableSecurityWarnings(),
    };

    const body = await this.engine.preview(rstDocument, webview);
    const useSphinx = body.search('</head>') > -1;
    // Content Security Policy
    const nonce = new Date().getTime() + '' + new Date().getMilliseconds();
    const csp = this.getCspForResource(sourceUri, nonce, useSphinx, webview);

    if (useSphinx) {
      // sphinx based preview.
      const newHead = body.replace(
        '</head>',
        `
			<meta id="vscode-rst-preview-data"
			data-settings="${JSON.stringify(initialData).replace(/"/g, '&quot;')}"
			data-strings="${JSON.stringify(previewStrings).replace(/"/g, '&quot;')}"
			data-state="${JSON.stringify(state || {}).replace(/"/g, '&quot;')}">
		<script src="${this.extensionResourcePath(
      'pre.js',
      webview
    )}" nonce="${nonce}"></script>
		<script src="${this.extensionResourcePath(
      'index.js',
      webview
    )}" nonce="${nonce}"></script>
		<base href="${webview.asWebviewUri(rstDocument.uri)}">
		</head>
			`
      );
      const newBody = newHead.replace(
        '<body class="',
        `<body class="vscode-body ${
          config.scrollBeyondLastLine ? 'scrollBeyondLastLine' : ''
        } ${config.wordWrap ? 'wordWrap' : ''} ${
          config.rstEditorSelection ? 'showEditorSelection' : ''
        } `
      );
      return newBody;
    } else {
      const parsedDoc = body
        .split(/\r?\n/)
        .map((l, i) =>
          l.replace(
            this.TAG_RegEx,
            (
              match: string,
              p1: string,
              p2: string,
              p3: string,
              p4: string,
              p5: string,
              p6: string,
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              offset: number
            ) =>
              typeof p5 !== 'string'
                ? `<${p1} class="linemarker linemarker-${i + 1}" ${p2}`
                : `<${p1} ${p3} class="${p5} linemarker linemarker-${
                    i + 1
                  }" ${p6}`
          )
        )
        .join('\n');
      return `<!DOCTYPE html>
				<html>
				<head>
					<meta http-equiv="Content-type" content="text/html;charset=UTF-8">
					${csp}
					<meta id="vscode-rst-preview-data"
						data-settings="${JSON.stringify(initialData).replace(/"/g, '&quot;')}"
						data-strings="${JSON.stringify(previewStrings).replace(/"/g, '&quot;')}"
						data-state="${JSON.stringify(state || {}).replace(/"/g, '&quot;')}">
					<script src="${this.extensionResourcePath(
            'pre.js',
            webview
          )}" nonce="${nonce}"></script>
					<script src="${this.extensionResourcePath(
            'index.js',
            webview
          )}" nonce="${nonce}"></script>
					${this.getStyles(sourceUri, nonce, config, webview)}
					<base href="${webview.asWebviewUri(rstDocument.uri)}">
				</head>
				<body class="vscode-body ${
          config.scrollBeyondLastLine ? 'scrollBeyondLastLine' : ''
        } ${config.wordWrap ? 'wordWrap' : ''} ${
        config.rstEditorSelection ? 'showEditorSelection' : ''
      }">
					${parsedDoc}
					<div class="code-line" data-line="${rstDocument.lineCount}"></div>
				</body>
				</html>`;
    }
  }

  private extensionResourcePath(
    mediaFile: string,
    webview: vscode.Webview
  ): string {
    return webview
      .asWebviewUri(
        vscode.Uri.file(
          this.context.extensionContext.asAbsolutePath(
            path.join('media', mediaFile)
          )
        )
      )
      .toString();
  }

  private fixHref(
    resource: vscode.Uri,
    href: string,
    webview: vscode.Webview
  ): string {
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
      return webview.asWebviewUri(vscode.Uri.file(href)).toString();
    }

    // Use a workspace relative path if there is a workspace
    const root = vscode.workspace.getWorkspaceFolder(resource);
    if (root) {
      return webview
        .asWebviewUri(vscode.Uri.file(path.join(root.uri.fsPath, href)))
        .toString();
    }

    // Otherwise look relative to the html file
    return webview
      .asWebviewUri(
        vscode.Uri.file(path.join(path.dirname(resource.fsPath), href))
      )
      .toString();
  }

  private computeCustomStyleSheetIncludes(
    resource: vscode.Uri,
    config: RSTPreviewConfiguration,
    webview: vscode.Webview
  ): string {
    if (Array.isArray(config.styles)) {
      return config.styles
        .map(style => {
          return `<link rel="stylesheet" class="code-user-style" data-source="${style.replace(
            /"/g,
            '&quot;'
          )}" href="${this.fixHref(
            resource,
            style,
            webview
          )}" type="text/css" media="screen">`;
        })
        .join('\n');
    }
    return '';
  }

  private getSettingsOverrideStyles(
    nonce: string,
    config: RSTPreviewConfiguration
  ): string {
    return `<style nonce="${nonce}">
			body {
				${config.fontFamily ? `font-family: ${config.fontFamily};` : ''}
				${isNaN(config.fontSize) ? '' : `font-size: ${config.fontSize}px;`}
				${isNaN(config.lineHeight) ? '' : `line-height: ${config.lineHeight};`}
			}
		</style>`;
  }

  private getStyles(
    resource: vscode.Uri,
    nonce: string,
    config: RSTPreviewConfiguration,
    webview: vscode.Webview
  ): string {
    const fix = (href: string) =>
      webview.asWebviewUri(vscode.Uri.file(href)).toString();
    const baseStyles = config.baseStyles
      .map(
        href => `<link rel="stylesheet" type="text/css" href="${fix(href)}">`
      )
      .join('\n');

    return `${baseStyles}
			${this.getSettingsOverrideStyles(nonce, config)}
			${this.computeCustomStyleSheetIncludes(resource, config, webview)}`;
  }

  private getCspForResource(
    resource: vscode.Uri,
    nonce: string,
    useSphinx: boolean,
    webview: vscode.Webview
  ): string {
    let securityLevel = this.cspArbiter.getSecurityLevelForResource(resource);
    if (useSphinx) {
      securityLevel = RSTPreviewSecurityLevel.AllowScriptsAndAllContent;
    }
    switch (securityLevel) {
      case RSTPreviewSecurityLevel.AllowInsecureContent:
        return `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} http: https: data:; media-src ${webview.cspSource} http: https: data:; script-src 'nonce-${nonce}'; style-src ${webview.cspSource} 'unsafe-inline' http: https: data:; font-src ${webview.cspSource} http: https: data:;">`;

      case RSTPreviewSecurityLevel.AllowInsecureLocalContent:
        return `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https: data: http://localhost:* http://127.0.0.1:*; media-src ${webview.cspSource} https: data: http://localhost:* http://127.0.0.1:*; script-src 'nonce-${nonce}'; style-src ${webview.cspSource} 'unsafe-inline' https: data: http://localhost:* http://127.0.0.1:*; font-src ${webview.cspSource} https: data: http://localhost:* http://127.0.0.1:*;">`;

      case RSTPreviewSecurityLevel.AllowScriptsAndAllContent:
        return '';

      case RSTPreviewSecurityLevel.Strict:
      default:
        return `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https: data:; media-src ${webview.cspSource} https: data:; script-src 'nonce-${nonce}'; style-src ${webview.cspSource} 'unsafe-inline' https: data:; font-src ${webview.cspSource} https: data:;">`;
    }
  }
}
