'use strict';
import { workspace, Disposable, Diagnostic, DiagnosticSeverity, Range } from 'vscode';

import { LintingProvider, LinterConfiguration, Linter } from './utils/lintingProvider';
import RstDocumentContentProvider from './rstDocumentContent';

export default class RstLintingProvider implements Linter {

	public languageId = 'restructuredtext';

	public activate(subscriptions: Disposable[]) {
		let provider = new LintingProvider(this);
		provider.activate(subscriptions)
	}

	public loadConfiguration(): LinterConfiguration {
		let section = workspace.getConfiguration(this.languageId);
		if (!section) return;

		var module: string[] = [];
		var python = RstDocumentContentProvider.loadSetting('pythonPath', null, 'python');
		var build: string;
		if (python == null) {
			build = section.get<string>('linter.executablePath', "restructuredtext-lint");
		}
		else {
			build = python;
			module = module.concat(["-m", "restructuredtext_lint.cli"]);
		}

		if (build == null) {
			build = "restructuredtext-lint";
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
		let sphinxDirectives: string[] = section.get<string[]>("linter.sphinxDirectives");//, ["toctree"]);
		let sphinxTextRoles: string[] = section.get<string[]>("linter.sphinxTextRoles");//, ["doc", "ref"]);
		let diagnostics: Diagnostic[] = [];
		lines.forEach(function (line) {
			const regex = /([A-Z]+)\s(.+?):([0-9]+)\s(.+)/;
			const matches = regex.exec(line);
			if (matches === null) {
				return;
			}

			const directiveFilter = /Unknown\sdirective\stype\s\"([a-zA-Z]+)"\./;
			const directive = directiveFilter.exec(matches[4]);
			if (directive !== null) {
				if (sphinxDirectives.indexOf(directive[1]) > -1) {
					return;
				}
			}

			const textRoleFilter = /Unknown\sinterpreted\stext\srole\s\"([a-zA-Z]+)"\./;
			const textRole = textRoleFilter.exec(matches[4]);
			if (textRole !== null) {
				if (sphinxTextRoles.indexOf(textRole[1]) > -1) {
					return;
				}
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