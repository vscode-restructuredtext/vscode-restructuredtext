'use strict';
import { workspace, Disposable, Diagnostic, DiagnosticSeverity, Range, Uri } from 'vscode';

import { LintingProvider, LinterConfiguration, Linter } from './utils/lintingProvider';
import { Configuration } from './utils/configuration';

export default class RstLintingProvider implements Linter {

	public languageId = 'restructuredtext';

	public activate(subscriptions: Disposable[]) {
		let provider = new LintingProvider(this);
		provider.activate(subscriptions)
	}

	public loadConfiguration(resource: Uri): LinterConfiguration {
		let section = workspace.getConfiguration(this.languageId);
		if (!section) return;

		var module: string[] = [];

		var build = Configuration.getLinterPath(resource);
		if (build == null) {
			var python = Configuration.getPythonPath(resource);
			if (python != null) {
				build = python;
				module = module.concat(["-m", "doc8.main"]);
			}
		}

		if (build == null) {
			build = "doc8";
		}

		return {
			executable: build,
			module: module,
			fileArgs: [],
			bufferArgs: [],
			extraArgs: section.get<string[]>('linter.extraArgs'),
			runTrigger: section.get<string>('linter.run', 'onType')
		}
	}

	public process(lines: string[]): Diagnostic[] {
		let section = workspace.getConfiguration(this.languageId);
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
