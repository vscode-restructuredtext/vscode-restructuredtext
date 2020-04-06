'use strict';
import { Disposable, Diagnostic, DiagnosticSeverity, Range, Uri } from 'vscode';

import { LintingProvider, LinterConfiguration, Linter } from './utils/lintingProvider';
import { Configuration } from './utils/configuration';
import { Logger } from '../logger';
import { Python } from '../python';

export default class RstLintingProvider implements Linter {

	public languageId = 'restructuredtext';

	public constructor(
		private readonly logger: Logger,
		private readonly python: Python)
    {
	}

	public activate(subscriptions: Disposable[]) {
		let provider = new LintingProvider(this, this.logger, this.python);
		provider.activate(subscriptions)
	}

	public loadConfiguration(resource: Uri): LinterConfiguration {

		var module: string[] = [];

		var build = Configuration.getLinterPath(resource);
		var name = Configuration.getLinterName(resource);
		if (build == null) {
			var python = Configuration.getPythonPath(resource);
			if (python) {
				build = '"' + python + '"';
				if (name === "doc8") {
					module = module.concat(["-m", "doc8.main"]);
				} else if (name === "rstcheck") {
					module = module.concat(["-m", "rstcheck"]);
				}
			}
		} else {
			build = '"' + build + '"';
		}

		if (build == null) {
			build = name;
		}

		return {
			executable: build,
			module: module,
			fileArgs: [],
			bufferArgs: [],
			extraArgs: Configuration.getExtraArgs(resource).map((value, index) => { return Configuration.expandMacro(value, resource)}),
			runTrigger: Configuration.getRunType(resource),
			rootPath: Configuration.GetRootPath(resource)
		}
	}

	public process(lines: string[]): Diagnostic[] {
		let diagnostics: Diagnostic[] = [];
		lines.forEach(function (line) {
			if (line.includes("No module named")) {
				diagnostics.push({
					range: new Range(0, 0, 0, Number.MAX_VALUE),
					severity: DiagnosticSeverity.Warning,
					message: line,
					code: null,
					source: 'restructuredtext'
				});
				return;
			}

			const regex = /(.+?):([0-9]+):\s(.+)/;
			const matches = regex.exec(line);
			if (matches === null) {
				return;
			}

			if (matches[1].endsWith(".py")) {
				// doc8 internal issues.
				return;
			}

			let lineNumber = parseInt(matches[2]) - 1;
			diagnostics.push({
				range: new Range(lineNumber, 0, lineNumber, Number.MAX_VALUE),
				severity: DiagnosticSeverity.Warning,
				message: matches[3],
				code: null,
				source: 'restructuredtext'
			});
		});
		return diagnostics;
	}
}
