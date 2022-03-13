import * as vscode from "vscode";
import { Configuration } from "../util/configuration";
import { Logger } from "../util/logger";
import { Python } from "../util/python";
import RstLintingProvider from "./rstLinter";

export async function activate(context: vscode.ExtensionContext, python: Python, logger: Logger) {

    let rstlintToDisable = false;
    const disabled = Configuration.getLinterDisabled();
    if (disabled.indexOf("doc8") == -1) {
        const doc8Path = Configuration.getDoc8Path();
        if (doc8Path || python.checkDoc8Install()) {
            const doc8 = new RstLintingProvider('doc8', 'doc8.main', doc8Path, Configuration.getDoc8ExtraArgs(), logger, python);
            doc8.activate(context.subscriptions);
            rstlintToDisable = true; // doc8 supersedes rst-lint.
            logger.log('Enabled doc8 linting...');
        }
    }

    if (disabled.indexOf("rstcheck") == -1) {
        const rstcheckPath = Configuration.getRstCheckPath();
        if (rstcheckPath || python.checkRstCheckInstall()) {
            const rstcheck = new RstLintingProvider('rstcheck', 'rstcheck', rstcheckPath, Configuration.getRstCheckExtraArgs(), logger, python);
            rstcheck.activate(context.subscriptions);
            logger.log('Enabled rstcheck linting...');
        }
    }

    if (disabled.indexOf("rst-lint") == -1 && !rstlintToDisable) {
        const rstlintPath = Configuration.getRstLintPath();
        if (rstlintPath || python.checkRstLintInstall()) {
            const rstlint = new RstLintingProvider('rst-lint', 'restructuredtext_lint.cli', rstlintPath, Configuration.getRstLintExtraArgs(), logger, python);
            rstlint.activate(context.subscriptions);
            logger.log('Enabled rst-lint linting...');
        }
    }
}