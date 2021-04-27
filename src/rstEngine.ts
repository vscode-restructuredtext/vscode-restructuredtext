<<<<<<< HEAD
import { TextDocument, OutputChannel, Uri } from "vscode";
=======
import { TextDocument, Uri, Webview } from "vscode";
>>>>>>> upstream/master
import * as path from "path";
import * as fs from 'fs';
import { Python } from "./python";
import { Logger } from "./logger";
import RstTransformerStatus from './features/utils/statusBar';
import { Configuration } from './features/utils/configuration';
import { exec } from 'child_process';

export class RSTEngine {
  public constructor(
    private readonly python: Python,
    private readonly logger: Logger,
    private readonly status: RstTransformerStatus,
  ) { }

  private errorSnippet(error: string): string {
    return `<html><body>${error}</body></html>`;
  }

<<<<<<< HEAD
  public async compile(fileName: string, uri: Uri, confPyDirectory: string, fixLinks: boolean): Promise<string> {
    this.logger.log(`Compiling file: ${fileName}`);
    if (confPyDirectory === '') {
      // docutil
      const writer = Configuration.getDocutilsWriter(uri);
      return this.python.exec(
        '"' + path.join(__dirname, "..", "python", "preview.py") + '"',
        '"' + fileName + '"',
        '"' + writer + '"'
=======
  public async compile(fileName: string, uri: Uri, confPyDirectory: string, fixLinks: boolean, webview: Webview): Promise<string> {
    this.logger.log(`[preview] Compiling file: ${fileName}`);
    if (confPyDirectory === '' || Configuration.getPreviewName() === 'docutil') {
      if (Configuration.getPreviewName() === 'docutil') {
        this.logger.log('[preview] Forced to use docutil due to setting "preview.name".')
      }

      // docutil
      const writer = Configuration.getDocutilsWriter(uri);
      const writerPart = Configuration.getDocutilsWriterPart(uri);
      return this.python.exec(
        '"' + path.join(__dirname, '..', 'python-scripts', 'preview.py') + '"',
        '"' + fileName + '"',
        '"' + writer + '"',
        '"' + writerPart + '"'
>>>>>>> upstream/master
      );
    } else {
      // sphinx
      let input = confPyDirectory;
<<<<<<< HEAD
      this.logger.appendLine('Sphinx conf.py directory: ' + input);
=======
      this.logger.log('[preview] Sphinx conf.py directory: ' + input);
>>>>>>> upstream/master

      // Make sure the conf.py file exists
      let confFile = path.join(input, 'conf.py');
      if (!fs.existsSync(confFile)) {
        await this.status.reset();
<<<<<<< HEAD
        this.logger.appendLine('conf.py not found. Refresh the settings.');
        input = confPyDirectory;
        this.logger.appendLine('Sphinx conf.py directory: ' + input);
=======
        this.logger.log('[preview] conf.py not found. Refresh the settings.');
        input = confPyDirectory;
        this.logger.log('[preview] Sphinx conf.py directory: ' + input);
>>>>>>> upstream/master
        confFile = path.join(input, 'conf.py');
      }

      // The directory where Sphinx will write the html output
      let output: string;
      const out = Configuration.getOutputFolder(uri);
      if (out == null) {
        output = path.join(input, '_build', 'html');
      } else {
        output = out;
      }

<<<<<<< HEAD
      this.logger.appendLine('Sphinx html directory: ' + output);

      let build = Configuration.getSphinxPath(uri);
      if (build == null) {
        const python = Configuration.getPythonPath(uri);
=======
      this.logger.log('[preview] Sphinx html directory: ' + output);

      let build = Configuration.getSphinxPath(uri);
      if (build == null) {
        const python = await Configuration.getPythonPath(uri);
>>>>>>> upstream/master
        if (python) {
          build = '"' + python + '" -m sphinx';
        }
      } else {
        build = '"' + build + '"';
      }

      if (build == null) {
        build = 'sphinx-build';
      }

      // Configure the sphinx-build command
<<<<<<< HEAD
      let options = { cwd: input };
      let cmd = [
=======
      const options = { cwd: input };
      const cmd = [
>>>>>>> upstream/master
        build,
        '-b html',
        '.',
        '"' + output + '"',
      ].join(' ');

      // Calculate full path to built html file.
      let whole = uri.fsPath;
      const ext = whole.lastIndexOf('.');
      whole = whole.substring(0, ext) + '.html';
<<<<<<< HEAD
      let htmlPath = path.join(output, this.relativeDocumentationPath(whole, input));
      return this.previewPage(htmlPath, cmd, input, options, fixLinks);
    }
  }

  private previewPage(htmlPath: string, cmd: string, input: string, options: any, fixLinks: boolean): Promise<string> {
    this.logger.appendLine('Compiler: ' + cmd);
    this.logger.appendLine('Working directory: ' + input);
    this.logger.appendLine('HTML file: ' + htmlPath);
=======
      const source = path.dirname(whole);
      const sourceRelative = path.relative(confPyDirectory, source);
      const outputRelative = path.relative(confPyDirectory, output);
      const htmlPath = path.join(confPyDirectory, outputRelative, sourceRelative, path.basename(whole));
      return this.previewPage(htmlPath, cmd, input, options, fixLinks, webview);
    }
  }

  private previewPage(htmlPath: string, cmd: string, input: string, options: any, fixLinks: boolean, webView: Webview): Promise<string> {
    this.logger.log('[preview] Compiler: ' + cmd);
    this.logger.log('[preview] Working directory: ' + input);
    this.logger.log('[preview] HTML file: ' + htmlPath);
>>>>>>> upstream/master

    // Build and display file.
    return new Promise<string>((resolve, reject) => {
      exec(cmd, options, (error, stdout, stderr) => {
        if (error) {
          const description =
            '<p>Cannot generate preview page.</p>\
                  <p>Possible causes are,</p>\
                  <ul>\
                  <li>Python is not installed properly.</li>\
                  <li>Sphinx is not installed properly (if preview uses "conf.py").</li>\
                  <li>Wrong value is set on "restructuredtext.sphinxBuildPath".</li>\
                  <li>A wrong "conf.py" file is selected.</li>\
                  <li>DocUtils is not installed properly (if preview uses docutils).</li>\
                  </ul>';
          const errorMessage = [
            error.name,
            error.message,
            error.stack,
            '',
            stderr.toString(),
          ].join('\n');
<<<<<<< HEAD
          resolve(this.showError(description, errorMessage));
=======
          resolve(this.showHelp(description, errorMessage));
>>>>>>> upstream/master
        }

        if (process.platform === 'win32' && stderr) {
          const errText = stderr.toString();
          if (errText.indexOf('Exception occurred:') > -1) {
            const description =
              '<p>Cannot generate preview page on Windows.</p>\
                      <p>Possible causes are,</p>\
                      <ul>\
                      <li>Python is not installed properly.</li>\
                      <li>Sphinx is not installed properly (if preview uses "conf.py").</li>\
                      <li>Wrong value is set on "restructuredtext.sphinxBuildPath".</li>\
                      <li>A wrong "conf.py" file is selected.</li>\
                      <li>DocUtils is not installed properly (if preview uses docutils).</li>\
                      </ul>';
<<<<<<< HEAD
            resolve(this.showError(description, errText));
=======
            resolve(this.showHelp(description, errText));
>>>>>>> upstream/master
          }
        }

        fs.readFile(htmlPath, 'utf8', (err, data) => {
          if (err === null) {
            if (fixLinks) {
<<<<<<< HEAD
              resolve(this.fixLinks(data, htmlPath));
=======
              resolve(this.fixLinks(data, htmlPath, webView));
>>>>>>> upstream/master
            } else {
              resolve(data);
            }
          } else {
            const description =
              '<p>Cannot read preview page "' + htmlPath + '".</p>\
                        <p>Possible causes are,</p>\
                        <ul>\
                        <li>A wrong "conf.py" file is selected.</li>\
                        <li>Wrong value is set on "restructuredtext.builtDocumentationPath".</li>\
                        </ul>';
            const errorMessage = [
              err.name,
              err.message,
              err.stack,
            ].join('\n');
<<<<<<< HEAD
            resolve(this.showError(description, errorMessage));
=======
            resolve(this.showHelp(description, errorMessage));
>>>>>>> upstream/master
          }
        });
      });
    });
  }

<<<<<<< HEAD
  private fixLinks(document: string, documentPath: string): string {
=======
  private fixLinks(document: string, documentPath: string, webView: Webview): string {
>>>>>>> upstream/master
    return document.replace(
        new RegExp('((?:src|href)=[\'\"])(.*?)([\'\"])', 'gmi'),
        (subString: string, p1: string, p2: string, p3: string): string => {
          const lower = p2.toLowerCase();
          if (p2.startsWith('#') || lower.startsWith('http://') || lower.startsWith('https://')) {
              return subString;
          }
<<<<<<< HEAD
          let newPath = Uri.file(path.join(path.dirname(documentPath), p2));
          const newUrl = [
              p1,
              newPath.with({ scheme: 'vscode-resource' }).toString(true),
=======
          const index = p2.indexOf('?');
          if (index > - 1) {
            p2 = p2.substr(0, index);
          }
          const newPath = Uri.file(path.join(path.dirname(documentPath), p2));
          const newUrl = [
              p1,
              webView.asWebviewUri(newPath),
>>>>>>> upstream/master
              p3,
          ].join('');
          return newUrl;
        },
    );
  }

  private showHelp(description: string, error: string): string {
    const help = '<body>\
    <section>\
      <article>\
        <header>\
          <h2>Cannot show preview page.</h2>\
          <h4>Description:</h4>\
          ' + description + '\
          <h4>Detailed error message</h4>\
          <pre>' + error + '</pre>\
          <h4>More Information</h4>\
          <p>Diagnostics information has been written to OUTPUT | reStructuredText panel.</p>\
          <p>The troubleshooting guide can be found at</p>\
          <pre>https://docs.restructuredtext.net/articles/troubleshooting.html</pre>\
        </header>\
      </article>\
    </section>\
  </body>';
    return help;
  }

<<<<<<< HEAD
  private showError(description: string, errorMessage: string): string {
    this.logger.appendLine('Description: ' + description);
    this.logger.appendLine('Error: ' + errorMessage);
    return this.showHelp(description, errorMessage);
  }

  private relativeDocumentationPath(whole: string, input: string): string {
    return whole.substring(input.length);
  }

  public async preview(doc: TextDocument): Promise<string> {
    try {
      if (this.status == null) {
        return this.compile(doc.fileName, doc.uri, '', true);
      } else if (this.status.config == null) {
        await this.status.refreshConfig(doc.uri);
      }
      return this.compile(doc.fileName, doc.uri, this.status.config.confPyDirectory, true);
=======
  public async preview(doc: TextDocument, webview: Webview): Promise<string> {
    try {
      if (this.status == null) {
        return this.compile(doc.fileName, doc.uri, '', true, webview);
      } else if (this.status.config == null) {
        await this.status.refreshConfig(doc.uri);
      }
      return this.compile(doc.fileName, doc.uri, this.status.config.confPyDirectory, true, webview);
>>>>>>> upstream/master
    } catch (e) {
      return this.errorSnippet(e.toString());
    }
  }
}
