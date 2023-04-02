'use strict';
import {Diagnostic, DiagnosticSeverity, Disposable, Range, Uri} from 'vscode';
import {Logger} from '../util/logger';
import {Python} from '../util/python';
import {Configuration} from '../util/configuration';
import {
  ILinter,
  ILinterConfiguration,
  LintingProvider,
} from './lintingProvider';
import container from '../inversify.config';
import {TYPES} from '../types';

export default class RstLintingProvider implements ILinter {
  public languageId = 'restructuredtext';

  public constructor(
    public name: string,
    private module: string,
    private path: string,
    private extraArgs: string[],
    private readonly logger: Logger,
    private readonly python: Python
  ) {}

  public activate(subscriptions: Disposable[]) {
    const provider = new LintingProvider(this, this.logger, this.python);
    provider.activate(subscriptions);
  }

  public async loadConfiguration(resource: Uri): Promise<ILinterConfiguration> {
    let module: string[] = [];
    const configuration = container.get<Configuration>(TYPES.Configuration);

    let build = this.path;
    if (build === null) {
      const python = await configuration.getPythonPath(resource);
      if (python) {
        build = '"' + python + '"';
        module = module.concat(['-m', this.module]);
      }
    } else {
      build = '"' + build + '"';
    }

    if (build === null) {
      build = this.name;
    }

    return {
      executable: build,
      module,
      fileArgs: [],
      bufferArgs: [],
      extraArgs: this.extraArgs.map(value =>
        configuration.expandMacro(value, resource)
      ),
      runTrigger: configuration.getRunType(resource),
      rootPath: configuration.getRootPath(resource),
    };
  }

  public process(contents: string[]): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    for (const text of contents) {
      if (text.includes('No module named') || text.includes('Errno')) {
        diagnostics.push({
          range: new Range(0, 0, 0, Number.MAX_VALUE),
          severity: DiagnosticSeverity.Warning,
          message: text,
          code: null,
          source: this.name,
        });
        continue;
      }

      const regex =
        /(([A-Z]+)\s+)?(.+?):([0-9]+):?\s(([A-Z0-9]+)\s)?(\(([A-Z]+)\/[0-9]+\)\s)?(.+)/;
      const matches = regex.exec(text);
      if (matches === null) {
        continue;
      }

      const severity1 = matches[2];
      const file = matches[3];
      const line = matches[4];
      const code = matches[6];
      const severity2 = matches[8];
      const message = matches[9];
      if (file.endsWith('.py') && this.name === 'doc8') {
        // doc8 internal issues.
        continue;
      }

      const lineNumber = parseInt(line, 10) - 1;
      diagnostics.push({
        range: new Range(lineNumber, 0, lineNumber, Number.MAX_VALUE),
        severity: DiagnosticSeverity.Warning,
        message,
        code: severity1 ?? severity2 ?? code,
        source: this.name,
      });
    }
    return diagnostics;
  }
}
