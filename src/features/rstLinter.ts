'use strict';
import { workspace, Disposable, Diagnostic, DiagnosticSeverity, Range } from 'vscode';

import { LintingProvider, LinterConfiguration, Linter } from './utils/lintingProvider';

export default class RstLintingProvider implements Linter {

	public languageId = 'restructuredtext';
	
	public activate(subscriptions: Disposable[]) {
		let provider = new LintingProvider(this);
		provider.activate(subscriptions)
	}
	
	public loadConfiguration(): LinterConfiguration {
		let section = workspace.getConfiguration(this.languageId);
		if (!section) return;
	
		return {
			executable: section.get<string>('linter.executablePath', 'restructuredtext-lint'),
			fileArgs: [],
			bufferArgs: [],
			extraArgs: [],
			runTrigger: section.get<string>('linter.run', 'onType')
		}
	}
	
	public process(lines: string[]): Diagnostic[] {
		let diagnostics: Diagnostic[] = [];
		lines.forEach(function (line) {
			const regex = /([A-Z]+)\s(.+?):([0-9]+)\s(.+)/;
            const matches = regex.exec(line);
            if (matches === null) {
              return;
			}
			
			let lineNumber = parseInt(matches[3]) - 1;
            diagnostics.push({
				range: new Range(lineNumber, 0, lineNumber, Number.MAX_VALUE),			
				severity: matches[1].toLowerCase().includes("error") ? DiagnosticSeverity.Error : DiagnosticSeverity.Warning,
				message: matches[4],
				code: null,
				source: 'restructuredtext-lint'
            });
		});
		return diagnostics;
	}
}