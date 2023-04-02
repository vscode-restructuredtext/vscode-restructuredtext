import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import {Python} from '../util/python';
import {Logger} from '../util/logger';
import {Configuration} from '../util/configuration';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {NAMES, TYPES} from '../types';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {inject, injectable, named} from 'inversify';
import {PreviewContext} from './PreviewContext';

@injectable()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class RSTEngine {
  public constructor(
    @inject(TYPES.Python) private readonly python: Python,
    @inject(TYPES.Logger)
    @named(NAMES.Main)
    private readonly logger: Logger,
    @inject(TYPES.PreviewContext) private readonly context: PreviewContext,
    @inject(TYPES.Configuration)
    private readonly configuration: Configuration
  ) {}

  private errorSnippet(error: string): string {
    return `<html><body>${error}</body></html>`;
  }

  public async compile(
    fileName: string,
    uri: vscode.Uri,
    fixLinks: boolean,
    webview: vscode.Webview
  ): Promise<string> {
    this.logger.log(`[preview] Compiling file: ${fileName}`);
    if (this.configuration.getPreviewName() === 'docutils') {
      this.logger.log(
        '[preview] Forced to use docutils due to setting "preview.name".'
      );
      return await this.useDocutils(uri, fileName);
    }

    if (this.context.esbonio.error) {
      // Fallback to docutils
      this.logger.log(
        '[preview] Esbonio detected build errors, falling back to docutils preview'
      );
      return await this.useDocutils(uri, fileName);
    }

    if (!this.context.esbonio.ready) {
      return this.showWait();
    }

    const confDir = this.context.esbonio.sphinxConfig.confDir;
    const output = this.context.esbonio.sphinxConfig.buildDir;

    this.logger.log('[preview] Sphinx conf.py directory: ' + confDir);
    this.logger.log('[preview] Sphinx html directory: ' + output);

    // Calculate full path to built html file.
    let whole = uri.fsPath;
    const ext = whole.lastIndexOf('.');
    whole = whole.substring(0, ext) + '.html';
    const source = path.dirname(whole);
    const sourceRelative = path.relative(confDir, source);
    const outputRelative = path.relative(confDir, output);
    const htmlPath = path.join(
      confDir,
      outputRelative,
      sourceRelative,
      path.basename(whole)
    );
    return this.previewPage(htmlPath, confDir, fixLinks, webview);
  }

  private async useDocutils(uri: vscode.Uri, fileName: string) {
    const writer = this.configuration.getDocutilsWriter(uri);
    const writerPart = this.configuration.getDocutilsWriterPart(uri);
    return await this.python.exec(
      '"' +
        path.join(__dirname, '..', '..', 'python-scripts', 'preview.py') +
        '"',
      '"' + fileName + '"',
      '"' + writer + '"',
      '"' + writerPart + '"'
    );
  }

  private previewPage(
    htmlPath: string,
    input: string,
    fixLinks: boolean,
    webView: vscode.Webview
  ): Promise<string> {
    this.logger.log('[preview] Working directory: ' + input);
    this.logger.log('[preview] HTML file: ' + htmlPath);

    // Build and display file.
    return new Promise<string>(resolve => {
      fs.readFile(htmlPath, 'utf8', (err, data) => {
        if (err === null) {
          if (fixLinks) {
            resolve(this.fixLinks(data, htmlPath, webView));
          } else {
            resolve(data);
          }
        } else {
          const description =
            '<p>Cannot read preview page "' +
            htmlPath +
            '".</p>\
                      <p>Possible causes are,</p>\
                      <ul>\
                      <li>A wrong "conf.py" file is selected.</li>\
                      <li>Wrong value is set on "esbonio.sphinx.buildDir".</li>\
                      </ul>';
          const errorMessage = [err.name, err.message, err.stack].join('\n');
          resolve(this.showHelp(description, errorMessage));
        }
      });
    });
  }

  private fixLinks(
    document: string,
    documentPath: string,
    webView: vscode.Webview
  ): string {
    return document.replace(
      new RegExp('((?:src|href)=[\'"])(.*?)([\'"])', 'gmi'),
      (subString: string, p1: string, p2: string, p3: string): string => {
        const lower = p2.toLowerCase();
        if (
          p2.startsWith('#') ||
          lower.startsWith('http://') ||
          lower.startsWith('https://')
        ) {
          return subString;
        }
        const index = p2.indexOf('?');
        if (index > -1) {
          p2 = p2.substring(0, index);
        }
        const newPath = vscode.Uri.file(
          path.join(path.dirname(documentPath), p2)
        );
        const newUrl = [p1, webView.asWebviewUri(newPath), p3].join('');
        return newUrl;
      }
    );
  }

  private showHelp(description: string, error: string): string {
    const help =
      '<body>\
    <section>\
      <article>\
        <header>\
          <h2>Cannot show preview page.</h2>\
          <h4>Description:</h4>\
          ' +
      description +
      '\
          <h4>Detailed error message</h4>\
          <pre>' +
      error +
      '</pre>\
          <h4>More Information</h4>\
          <p>Diagnostics information has been written to OUTPUT | Esbonio Language Server panel.</p>\
          <p>The troubleshooting guide can be found at</p>\
          <pre>https://docs.restructuredtext.net/articles/troubleshooting.html</pre>\
        </header>\
      </article>\
    </section>\
  </body>';
    return help;
  }

  private showWait(): string {
    const help =
      '<body>\
    <section>\
      <article>\
        <header>\
          <h2>Esbonio is busy.</h2>\
          <h4>Description:</h4>\
          <p>Esbonio is still working in the background. This panel will automatically refresh when the preview page is ready.</p>\
          <h4>More Information</h4>\
          <p>Diagnostics information has been written to OUTPUT | Esbonio Language Server panel.</p>\
          <p>The troubleshooting guide can be found at</p>\
          <pre>https://docs.restructuredtext.net/articles/troubleshooting.html</pre>\
        </header>\
      </article>\
    </section>\
  </body>';
    return help;
  }

  public async preview(
    doc: vscode.TextDocument,
    webview: vscode.Webview
  ): Promise<string> {
    try {
      return this.compile(doc.fileName, doc.uri, true, webview);
    } catch (e) {
      return this.errorSnippet(e.toString());
    }
  }
}
