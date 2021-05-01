'use strict';
import { Diagnostic, DiagnosticSeverity, Disposable, Range, Uri } from 'vscode';

import { Logger } from '../logger';
import { Python } from '../python';
import { Configuration } from './utils/configuration';
import { ILinter, ILinterConfiguration, LintingProvider } from './utils/lintingProvider';

export default class RstLintingProvider implements ILinter {

    public languageId = 'restructuredtext';

    public constructor(
        private readonly logger: Logger,
        private readonly python: Python) {
    }

    public activate(subscriptions: Disposable[]) {
        const provider = new LintingProvider(this, this.logger, this.python);
        provider.activate(subscriptions);
    }

    public async loadConfiguration(resource: Uri): Promise<ILinterConfiguration> {

        let module: string[] = [];

        let build = Configuration.getLinterPath(resource);
        const name = Configuration.getLinterName(resource);
        if (build == null) {
            const python = await Configuration.getPythonPath(resource);
            if (python) {
                build = process.platform === 'win32'
                    ? '"' + python + '"'
                    : python;
                if (name === 'doc8') {
                    module = module.concat(['-m', 'doc8.main']);
                } else if (name === 'rstcheck') {
                    module = module.concat(['-m', 'rstcheck']);
                }
            }
        } else {
            if (process.platform === 'win32') {
                build = '"' + build + '"';
            }
        }

        if (build == null) {
            build = name;
        }

        return {
            executable: build,
            module,
            fileArgs: [],
            bufferArgs: [],
            extraArgs: Configuration.getExtraArgs(resource).map((value, index) => Configuration.expandMacro(value, resource)),
            runTrigger: Configuration.getRunType(resource),
            rootPath: Configuration.GetRootPath(resource)
        };
    }

    public process(lines: string[]): Diagnostic[] {
        const diagnostics: Diagnostic[] = [];
        for (const line of lines) {
            if (line.includes('No module named') || line.includes('Errno')) {
                diagnostics.push({
                    range: new Range(0, 0, 0, Number.MAX_VALUE),
                    severity: DiagnosticSeverity.Warning,
                    message: line,
                    code: null,
                    source: 'restructuredtext'
                });
                continue;
            }

            const regex = /(.+?):([0-9]+):\s(.+)/;
            const matches = regex.exec(line);
            if (matches === null) {
                continue;
            }

            if (matches[1].endsWith('.py')) {
                // doc8 internal issues.
                continue;
            }

            const lineNumber = parseInt(matches[2], 10) - 1;
            diagnostics.push({
                range: new Range(lineNumber, 0, lineNumber, Number.MAX_VALUE),
                severity: DiagnosticSeverity.Warning,
                message: matches[3],
                code: null,
                source: 'restructuredtext'
            });
        }
        return diagnostics;
    }
}
