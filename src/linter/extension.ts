import * as vscode from 'vscode';
import container from '../inversify.config';
import {TYPES} from '../types';
import {Configuration} from '../util/configuration';
import {Logger} from '../util/logger';
import {Python} from '../util/python';
import RstLintingProvider from './rstLinter';

export async function activate(
    context: vscode.ExtensionContext,
    python: Python,
    logger: Logger
) {
    let rstlintToDisable = false;
    const configuration = container.get<Configuration>(TYPES.Configuration);
    const disabled = configuration.getLinterDisabled();
    if (disabled.indexOf('doc8') === -1) {
        rstlintToDisable = await setupDoc8Linter(context, configuration, logger, python);
    }

    if (disabled.indexOf('rstcheck') === -1) {
        await setupRstCheckLinter(context, configuration, logger, python);
    }

    if (disabled.indexOf('rst-lint') === -1 && !rstlintToDisable) {
        const rstlintPath = configuration.getRstLintPath();
        if (rstlintPath) {
            if (!(await python.checkRstLintInstall())) {
                logger.warning("Didn't detect rst-lint module, skipping.. (explicit path configured)");
                return;
            }
        } else if (!(await python.checkRstLintInstall())) {
            logger.debug("Didn't detect rst-lint module, skipping..");
            return;
        }

        const rstlint = new RstLintingProvider(
            'rst-lint',
            'restructuredtext_lint.cli',
            null,
            configuration.getRstLintExtraArgs(),
            logger,
            python
        );
        rstlint.activate(context.subscriptions);
        logger.info('Enabled rst-lint linting...');
    }
}

async function setupDoc8Linter(
    context: vscode.ExtensionContext,
    configuration: Configuration,
    logger: Logger,
    python: Python
): Promise<boolean> {
    const doc8Path = configuration.getDoc8Path();
    if (doc8Path) {
        if (!(await python.checkDoc8Install())) {
            logger.warning("Didn't detect doc8 module, skipping.. (explicit path configured)");
            return false;
        }
    } else if (!(await python.checkDoc8Install())) {
        logger.debug("Didn't detect doc8 module, skipping..");
        return false;
    }

    const semver = require('semver');
    const version = await python.checkDoc8Version();
    if (semver.lt(version, '0.8.1')) {
        logger.warning(`Detected old doc8 version ${version}, skipping..`);
        return false;
    }

    const doc8 = new RstLintingProvider(
        'doc8',
        'doc8',
        null,
        configuration.getDoc8ExtraArgs(),
        logger,
        python
    );
    doc8.activate(context.subscriptions);
    logger.info('Enabled doc8 linting...');
    return true; // doc8 supersedes rst-lint.
}

async function setupRstCheckLinter(
    context: vscode.ExtensionContext,
    configuration: Configuration,
    logger: Logger,
    python: Python
): Promise<void> {
    const rstcheckPath = configuration.getRstCheckPath();
    if (rstcheckPath) {
        if (!(await python.checkRstCheckInstall())) {
            logger.warning("Didn't detect rstcheck module, skipping.. (explicit path configured)");
            return;
        }
    } else if (!(await python.checkRstCheckInstall())) {
        logger.debug("Didn't detect rstcheck module, skipping..");
        return;
    }

    const major = require('semver/functions/major');
    const version = await python.checkRstCheckVersion();
    const value = major(version);
    if (value < 6) {
        logger.warning(`Detected old rstcheck version ${version}, skipping..`);
        return;
    }

    const rstcheck = new RstLintingProvider(
        'rstcheck',
        'rstcheck._cli',
        null,
        configuration.getRstCheckExtraArgs(),
        logger,
        python
    );
    rstcheck.activate(context.subscriptions);
    logger.info('Enabled rstcheck linting...');
}
