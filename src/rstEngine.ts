import { TextDocument, OutputChannel, Uri } from "vscode";
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

  public async compile(fileName: string, uri: Uri, confPyDirectory: string, fixLinks: boolean): Promise<string> {
    this.logger.log(`Compiling file: ${fileName}`);
    if (confPyDirectory === '') {
      // docutil
      return this.python.exec(
        '"' + path.join(__dirname, "..", "python", "preview.py") + '"',
        '"' + fileName + '"'
      );
    } else {
      // sphinx
      let input = confPyDirectory;
      this.logger.appendLine('Sphinx conf.py directory: ' + input);

      // Make sure the conf.py file exists
      let confFile = path.join(input, 'conf.py');
      if (!fs.existsSync(confFile)) {
        await this.status.reset();
        this.logger.appendLine('conf.py not found. Refresh the settings.');
        input = confPyDirectory;
        this.logger.appendLine('Sphinx conf.py directory: ' + input);
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

      this.logger.appendLine('Sphinx html directory: ' + output);
      const quotedOutput = '"' + output + '"';

      let build = Configuration.getSphinxPath(uri);
      if (build == null) {
        const python = Configuration.getPythonPath(uri);
        if (python) {
          build = python + ' -m sphinx';
        }
      }

      if (build == null) {
        build = 'sphinx-build';
      }

      // Configure the sphinx-build command
      let options = { cwd: input };
      let cmd = [
        build,
        '-b html',
        '.',
        quotedOutput,
      ].join(' ');

      // Calculate full path to built html file.
      let whole = uri.fsPath;
      const ext = whole.lastIndexOf('.');
      whole = whole.substring(0, ext) + '.html';
      let htmlPath = path.join(output, this.relativeDocumentationPath(whole, input));
      return this.previewPage(htmlPath, cmd, input, options, fixLinks);
    }
  }

  private previewPage(htmlPath: string, cmd: string, input: string, options: any, fixLinks: boolean): Promise<string> {
    this.logger.appendLine('Compiler: ' + cmd);
    this.logger.appendLine('Working directory: ' + input);
    this.logger.appendLine('HTML file: ' + htmlPath);

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
          resolve(this.showError(description, errorMessage));
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
            resolve(this.showError(description, errText));
          }
        }

        fs.readFile(htmlPath, 'utf8', (err, data) => {
          if (err === null) {
            if (fixLinks) {
              resolve(this.fixLinks(data, htmlPath));
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
            resolve(this.showError(description, errorMessage));
          }
        });
      });
    });
  }

  private fixLinks(document: string, documentPath: string): string {
    return document.replace(
        new RegExp('((?:src|href)=[\'\"])(.*?)([\'\"])', 'gmi'),
        (subString: string, p1: string, p2: string, p3: string): string => {
          const lower = p2.toLowerCase();
          if (p2.startsWith('#') || lower.startsWith('http://') || lower.startsWith('https://')) {
              return subString;
          }
            const newUrl = [
                p1,
                process.platform === 'win32' ? 'vscode-resource:\\' : 'vscode-resource:',
                path.join(
                    path.dirname(documentPath),
                    p2,
                ),
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
    } catch (e) {
      return this.errorSnippet(e.toString());
    }
  }
}
