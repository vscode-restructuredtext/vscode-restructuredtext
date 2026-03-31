import * as vscode from 'vscode';
import * as path from 'path';
import container from '../inversify.config';
import {TYPES} from '../types';
import {Configuration} from '../util/configuration';
import {Logger} from '../util/logger';
import {Python} from '../util/python';
import {releasePolicies} from './releases';
import RstLintingProvider from './rstLinter';

const shownUpgradePrompts = new Set<string>();
const promptedUnsupportedReleases: string[] = [];
const promptedUpgradeCommands = new Map<string, string>();
const PYTHON_ENVS_EXTENSION = 'ms-python.vscode-python-envs';

export function getPromptedUnsupportedReleases(): string[] {
    return promptedUnsupportedReleases.slice();
}

export function getPromptedUpgradeCommands(): Record<string, string> {
    return Object.fromEntries(promptedUpgradeCommands.entries());
}

export function resetPromptedUnsupportedReleases(): void {
    promptedUnsupportedReleases.length = 0;
    shownUpgradePrompts.clear();
    promptedUpgradeCommands.clear();
}

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

        const version = await python.checkRstLintVersion();
        if (
            !(await validateSupportedRelease(
                'rst-lint',
                version,
                configuration,
                logger,
                rstlintPath
            ))
        ) {
            return;
        }

        const rstlint = new RstLintingProvider(
            'rst-lint',
            'restructuredtext_lint.cli',
            rstlintPath ?? null,
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

    const version = await python.checkDoc8Version();
    if (
        !(await validateSupportedRelease(
            'doc8',
            version,
            configuration,
            logger,
            doc8Path
        ))
    ) {
        return false;
    }

    const doc8 = new RstLintingProvider(
        'doc8',
        'doc8',
        doc8Path ?? null,
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

    const version = await python.checkRstCheckVersion();
    if (
        !(await validateSupportedRelease(
            'rstcheck',
            version,
            configuration,
            logger,
            rstcheckPath
        ))
    ) {
        return;
    }

    const major = require('semver/functions/major');
    const semver = require('semver');
    const coerced = semver.coerce(version.trim());
    const value = coerced ? major(coerced.version) : 0;

    const module = value >= 6 ? 'rstcheck._cli' : null;
    const executableName = value >= 6 ? null : 'rstcheck';

    const rstcheck = new RstLintingProvider(
        'rstcheck',
        module,
        rstcheckPath ?? null,
        executableName,
        configuration.getRstCheckExtraArgs(),
        logger,
        python
    );
    rstcheck.activate(context.subscriptions);
    logger.info('Enabled rstcheck linting...');
}

async function validateSupportedRelease(
    linterName: keyof typeof releasePolicies,
    detectedVersion: string,
    configuration: Configuration,
    logger: Logger,
    configuredExecutablePath?: string
): Promise<boolean> {
    const semver = require('semver');
    const policy = releasePolicies[linterName];
    const normalized = detectedVersion.trim();
    const coerced = semver.coerce(normalized);
    const major = coerced ? semver.major(coerced.version) : undefined;
    if (major !== undefined && policy.supportedMajorVersions.includes(major)) {
        return true;
    }

    const supportedMajors = policy.supportedMajorVersions
        .map(value => `${value}.x`)
        .join(' and ');
    const message =
        `Detected unsupported ${policy.name} version ${normalized || 'unknown'}. ` +
        `This extension supports ${supportedMajors} and skips older releases.`;
    logger.warning(message);
    await promptToUpgrade(
        policy,
        normalized,
        configuration,
        configuredExecutablePath
    );
    return false;
}

async function promptToUpgrade(
    policy: (typeof releasePolicies)[keyof typeof releasePolicies],
    detectedVersion: string,
    configuration: Configuration,
    configuredExecutablePath?: string
): Promise<void> {
    const promptKey = `${policy.name}:${detectedVersion}`;
    if (shownUpgradePrompts.has(promptKey)) {
        return;
    }
    shownUpgradePrompts.add(promptKey);
    promptedUnsupportedReleases.push(promptKey);

    const suggestedCommand = await getUpgradeCommand(
        policy,
        configuration,
        configuredExecutablePath
    );
    promptedUpgradeCommands.set(promptKey, suggestedCommand);
    if (configuration.getLinterInstallRecommendationDisabled()) {
        return;
    }
    if (process.env.RST_LINTER_TEST_SUPPRESS_PROMPTS === '1') {
        return;
    }

    const openLabel = 'Open Release Info';
    const runLabel = 'Run Suggested Command';
    const installLabel = 'Copy Suggested Command';
    const neverAskLabel = 'Never Ask Again';
    const selection = await vscode.window.showWarningMessage(
        `reStructuredText detected unsupported ${policy.name} ${detectedVersion}. ` +
            `Upgrade to a supported release line (${policy.supportedMajorVersions
                .map(value => `${value}.x`)
                .join(' or ')}). Latest stable: ${policy.latestStableVersion}. ` +
            `Suggested command: ${suggestedCommand}`,
        openLabel,
        runLabel,
        installLabel,
        neverAskLabel
    );

    if (selection === openLabel) {
        await vscode.env.openExternal(vscode.Uri.parse(policy.upgradeUrl));
    } else if (selection === runLabel) {
        const terminal =
            vscode.window.activeTerminal ??
            vscode.window.createTerminal('reStructuredText');
        terminal.show(true);
        terminal.sendText(suggestedCommand, true);
    } else if (selection === installLabel) {
        await vscode.env.clipboard.writeText(suggestedCommand);
        await vscode.window.showInformationMessage(
            `Copied upgrade command for ${policy.name} to the clipboard.`
        );
    } else if (selection === neverAskLabel) {
        await configuration.setLinterInstallRecommendationDisabled();
    }
}

function getPromptResource(): vscode.Uri | undefined {
    const activeDocument = vscode.window.activeTextEditor?.document;
    if (activeDocument?.uri) {
        return activeDocument.uri;
    }

    return vscode.workspace.workspaceFolders?.[0]?.uri;
}

async function getUpgradeCommand(
    policy: (typeof releasePolicies)[keyof typeof releasePolicies],
    configuration: Configuration,
    configuredExecutablePath?: string
): Promise<string> {
    const resource = getPromptResource();
    const envInfo = await getPythonEnvironmentInfo(
        resource,
        configuration,
        configuredExecutablePath
    );
    const packageName = policy.packageName;

    if (envInfo.managerId?.endsWith(':poetry')) {
        return `poetry add --group dev ${packageName}`;
    }

    if (envInfo.managerId?.endsWith(':pipenv')) {
        return `pipenv install --dev ${packageName}`;
    }

    if (envInfo.managerId?.endsWith(':conda')) {
        if (envInfo.sysPrefix) {
            return `conda run -p "${envInfo.sysPrefix}" python -m pip install -U ${packageName}`;
        }
        return `conda run python -m pip install -U ${packageName}`;
    }

    if (envInfo.pythonPath && (await isUvEnvironment(envInfo.pythonPath))) {
        return `uv pip install --python "${envInfo.pythonPath}" -U ${packageName}`;
    }

    if (envInfo.pythonPath) {
        return `"${envInfo.pythonPath}" -m pip install -U ${packageName}`;
    }

    return `python -m pip install -U ${packageName}`;
}

async function getPythonEnvironmentInfo(
    resource: vscode.Uri | undefined,
    configuration: Configuration,
    configuredExecutablePath?: string
): Promise<{managerId?: string; pythonPath?: string; sysPrefix?: string}> {
    try {
        const extension = vscode.extensions.getExtension(PYTHON_ENVS_EXTENSION);
        if (extension) {
            if (!extension.isActive) {
                await extension.activate();
            }

            const api = extension.exports as {
                getEnvironment?: (
                    scope: vscode.Uri | undefined
                ) => Promise<
                    | {
                          envId?: {managerId?: string};
                          execInfo?: {run?: {executable?: string}};
                          sysPrefix?: string;
                      }
                    | undefined
                >;
            };
            if (api?.getEnvironment) {
                const environment = await api.getEnvironment(resource);
                if (environment) {
                    return {
                        managerId: environment.envId?.managerId,
                        pythonPath: environment.execInfo?.run?.executable,
                        sysPrefix: environment.sysPrefix,
                    };
                }
            }
        }
    } catch (error) {
        loggerDebugEnvironmentInfo(error);
    }

    const inferredPython = inferPythonPathFromExecutable(configuredExecutablePath);
    if (inferredPython) {
        return {
            pythonPath: inferredPython,
            sysPrefix: path.dirname(path.dirname(inferredPython)),
        };
    }

    const pythonPath = await configuration.getPythonPath(resource);
    return {
        pythonPath,
    };
}

function loggerDebugEnvironmentInfo(_error: unknown): void {
    // Best-effort only; falling back to the selected interpreter path is sufficient.
}

async function isUvEnvironment(pythonPath: string): Promise<boolean> {
    if (vscode.env.uiKind !== vscode.UIKind.Desktop) {
        return false;
    }

    const cfgPath = path.join(path.dirname(path.dirname(pythonPath)), 'pyvenv.cfg');
    try {
        const fs = await import('fs');
        const contents = fs.readFileSync(cfgPath, 'utf8');
        return /^\s*uv\s*=/m.test(contents);
    } catch (error) {
        return false;
    }
}

function inferPythonPathFromExecutable(
    executablePath: string | undefined
): string | undefined {
    if (!executablePath) {
        return undefined;
    }

    const dir = path.dirname(executablePath);
    const candidate = path.join(
        dir,
        process.platform === 'win32' ? 'python.exe' : 'python'
    );
    return candidate;
}
