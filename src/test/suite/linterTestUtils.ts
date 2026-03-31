import * as vscode from 'vscode';

import {wait} from './initialize';
import {
  getPromptedUpgradeCommands,
  getPromptedUnsupportedReleases,
  resetPromptedUnsupportedReleases,
} from '../../linter/extension';

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
