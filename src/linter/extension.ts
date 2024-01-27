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
        const doc8Path = configuration.getDoc8Path();
        if (doc8Path) {
            const doc8 = new RstLintingProvider(
                'doc8',
                null,
                doc8Path,
                configuration.getDoc8ExtraArgs(),
                logger,
                python
            );
            doc8.activate(context.subscriptions);
            rstlintToDisable = true; // doc8 supersedes rst-lint.
            logger.log('Enabled doc8 linting...');
        }

        if (!(await python.checkDoc8Install())) {
            logger.log("Didn't detect doc8 module, skipping..");
            return;
        }

        const semver = require('semver');
        const version = await python.checkDoc8Version();
        if (semver.lt(version, '0.8.1')) {
            logger.log(`Detected old doc8 version ${version}, skipping..`);
            return;
        }

        const doc8 = new RstLintingProvider(
            'doc8',
            'doc8.main',
            null,
            configuration.getDoc8ExtraArgs(),
            logger,
            python
        );
        doc8.activate(context.subscriptions);
        rstlintToDisable = true; // doc8 supersedes rst-lint.
        logger.log('Enabled doc8 linting...');
    }

    if (disabled.indexOf('rstcheck') === -1) {
        const rstcheckPath = configuration.getRstCheckPath();
        if (rstcheckPath) {
            const rstcheck = new RstLintingProvider(
                'rstcheck',
                null,
                rstcheckPath,
                configuration.getRstCheckExtraArgs(),
                logger,
                python
            );
            rstcheck.activate(context.subscriptions);
            logger.log('Enabled rstcheck linting...');
            return;
        }

        if (!(await python.checkRstCheckInstall())) {
            logger.log("Didn't detect rstcheck module, skipping..");
            return;
        }

        const major = require('semver/functions/major');
        const version = await python.checkRstCheckVersion();
        const value = major(version);
        if (value < 6) {
            logger.log(`Detected old rstcheck version ${version}, skipping..`);
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
        logger.log('Enabled rstcheck linting...');
    }

    if (disabled.indexOf('rst-lint') === -1 && !rstlintToDisable) {
        const rstlintPath = configuration.getRstLintPath();
        if (rstlintPath || (await python.checkRstLintInstall())) {
            const rstlint = new RstLintingProvider(
                'rst-lint',
                'restructuredtext_lint.cli',
                rstlintPath,
                configuration.getRstLintExtraArgs(),
                logger,
                python
            );
            rstlint.activate(context.subscriptions);
            logger.log('Enabled rst-lint linting...');
        }
    }
}
