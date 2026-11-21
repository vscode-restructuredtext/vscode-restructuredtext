import * as vscode from 'vscode';

import {wait} from './initialize';

interface ExtensionTestApi {
  getDisplayedUpgradePrompts?: () => string[];
  getPromptedUpgradeCommands?: () => Record<string, string>;
  getPromptedUnsupportedReleases?: () => string[];
  promptUnsupportedReleaseForTests?: (
    linterName: string,
    detectedVersion: string,
    configuredExecutablePath?: string
  ) => Promise<boolean>;
  resetPromptedUnsupportedReleases?: () => void;
  setUpgradePromptTestResponses?: (responses: string[]) => void;
  getRecommendationCommandInvocations?: () => Array<{
    command: string;
    extensionId: string;
  }>;
  getRecommendationExternalUrls?: () => string[];
  getRecommendationPromptEvents?: () => Array<{
    message: string;
    options: string[];
  }>;
  resetRecommendationPromptTestState?: () => void;
  runRecommendationFlowForTests?: () => Promise<void>;
  setRecommendationPromptTestResponses?: (responses: string[]) => void;
}

function getApi(): ExtensionTestApi {
  const extension = vscode.extensions.getExtension(
    'lextudio.restructuredtext'
  );
  if (!extension?.isActive) {
    return {};
  }
  return (extension.exports ?? {}) as ExtensionTestApi;
}

function getDisplayedUpgradePrompts(): string[] {
  return getApi().getDisplayedUpgradePrompts?.() ?? [];
}

function getPromptedUpgradeCommands(): Record<string, string> {
  return getApi().getPromptedUpgradeCommands?.() ?? {};
}

function getPromptedUnsupportedReleases(): string[] {
  return getApi().getPromptedUnsupportedReleases?.() ?? [];
}

function resetPromptedUnsupportedReleases() {
  getApi().resetPromptedUnsupportedReleases?.();
}

function setUpgradePromptTestResponses(responses: string[]) {
  getApi().setUpgradePromptTestResponses?.(responses);
}

async function promptUnsupportedReleaseForTests(
  linterName: string,
  detectedVersion: string,
  configuredExecutablePath?: string
) {
  return getApi().promptUnsupportedReleaseForTests?.(
    linterName,
    detectedVersion,
    configuredExecutablePath
  );
}

function getRecommendationCommandInvocations() {
  return getApi().getRecommendationCommandInvocations?.() ?? [];
}

function getRecommendationExternalUrls() {
  return getApi().getRecommendationExternalUrls?.() ?? [];
}

function getRecommendationPromptEvents() {
  return getApi().getRecommendationPromptEvents?.() ?? [];
}

function resetRecommendationPromptTestState() {
  getApi().resetRecommendationPromptTestState?.();
}

function setRecommendationPromptTestResponses(responses: string[]) {
  getApi().setRecommendationPromptTestResponses?.(responses);
}

async function runRecommendationFlowForTests() {
  await getApi().runRecommendationFlowForTests?.();
}

export const linterTestTarget = process.env.RST_LINTER_TEST_TARGET;
export const linterTestVersion = process.env.RST_LINTER_TEST_VERSION ?? 'unknown';
export const linterTestExecutable = process.env.RST_LINTER_TEST_EXECUTABLE;
export const linterTestsEnabled = process.env.RST_LINTER_TESTS === '1';

export function getExpectedPythonFromExecutable(
  executablePath: string | undefined
): string | undefined {
  if (!executablePath) {
    return undefined;
  }

  const separator = executablePath.includes('\\') ? '\\' : '/';
  const parts = executablePath.split(separator);
  parts[parts.length - 1] = executablePath.endsWith('.exe') ? 'python.exe' : 'python';
  return parts.join(separator);
}

export function diagnosticCode(
  value: vscode.Diagnostic['code']
): string | undefined {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return value?.value;
}

export async function updateGlobalSetting(section: string, value: unknown) {
  await vscode.workspace
    .getConfiguration('restructuredtext')
    .update(section, value, vscode.ConfigurationTarget.Global);
}

export async function waitForDiagnostics(
  uri: vscode.Uri,
  source: string,
  predicate: (diagnostics: vscode.Diagnostic[]) => boolean,
  timeout = 15000
): Promise<vscode.Diagnostic[]> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const diagnostics = vscode.languages
      .getDiagnostics(uri)
      .filter(diagnostic => diagnostic.source === source);

    if (predicate(diagnostics)) {
      return diagnostics;
    }

    await wait(200);
  }

  return vscode.languages
    .getDiagnostics(uri)
    .filter(diagnostic => diagnostic.source === source);
}

export async function waitForUnsupportedReleasePrompt(
  expectedKey: string,
  timeout = 15000
): Promise<string[]> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const prompts = getPromptedUnsupportedReleases();
    if (prompts.includes(expectedKey)) {
      return prompts;
    }

    await wait(200);
  }

  return getPromptedUnsupportedReleases();
}

export async function waitForUpgradeCommand(
  expectedKey: string,
  timeout = 15000
): Promise<string | undefined> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const commands = getPromptedUpgradeCommands();
    if (commands[expectedKey]) {
      return commands[expectedKey];
    }

    await wait(200);
  }

  return getPromptedUpgradeCommands()[expectedKey];
}

export function clearUnsupportedReleasePrompts() {
  resetPromptedUnsupportedReleases();
}

export function getDisplayedUnsupportedReleasePrompts(): string[] {
  return getDisplayedUpgradePrompts();
}

export function queueUpgradePromptResponses(responses: string[]) {
  setUpgradePromptTestResponses(responses);
}

export async function triggerUnsupportedReleasePrompt(
  linterName: 'doc8' | 'rstcheck' | 'rst-lint',
  detectedVersion: string,
  configuredExecutablePath?: string
) {
  return promptUnsupportedReleaseForTests(
    linterName,
    detectedVersion,
    configuredExecutablePath
  );
}

export function resetRecommendationPrompts() {
  resetRecommendationPromptTestState();
}

export function queueRecommendationPromptResponses(responses: string[]) {
  setRecommendationPromptTestResponses(responses);
}

export function getRecommendationPrompts() {
  return getRecommendationPromptEvents();
}

export function getRecommendationCommands() {
  return getRecommendationCommandInvocations();
}

export function getRecommendationUrls() {
  return getRecommendationExternalUrls();
}

export async function triggerRecommendationFlow() {
  await runRecommendationFlowForTests();
}
