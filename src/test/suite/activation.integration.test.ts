import * as assert from 'assert';
import * as vscode from 'vscode';

import container from '../../inversify.config';
import {TYPES} from '../../types';
import {Configuration} from '../../util/configuration';
import {DefaultConfig} from '../../util/config';
import {
  clearUnsupportedReleasePrompts,
  getDisplayedUnsupportedReleasePrompts,
  getRecommendationCommands,
  getRecommendationPrompts,
  getRecommendationUrls,
  queueRecommendationPromptResponses,
  queueUpgradePromptResponses,
  resetRecommendationPrompts,
  triggerRecommendationFlow,
  triggerUnsupportedReleasePrompt,
} from './linterTestUtils';
import {wait} from './initialize';

suite('Activation Integration Tests', function () {
  this.timeout(120000);

  const configuration = container.get<Configuration>(TYPES.Configuration);
  const resource = vscode.workspace.workspaceFolders?.[0]?.uri;

  if (!resource) {
    return;
  }

  test('workspace trust gating ignores workspace linter paths until trusted', async () => {
    const section = 'linter.doc8.executablePath';
    const settings = vscode.workspace.getConfiguration('restructuredtext', resource);
    const inspect = settings.inspect<string>(section);
    const originalGlobalValue = inspect?.globalValue;
    const originalWorkspaceValue = inspect?.workspaceValue;
    const originalTrusted = DefaultConfig().workspaceIsTrusted();
    const globalPath = '/tmp/restructuredtext-global-doc8';
    const workspacePath = '/tmp/restructuredtext-workspace-doc8';

    try {
      if (DefaultConfig().workspaceIsTrusted()) {
        await vscode.commands.executeCommand(
          'restructuredtext.workspace.isTrusted.toggle'
        );
        await wait(100);
      }

      await settings.update(
        section,
        globalPath,
        vscode.ConfigurationTarget.Global
      );
      await settings.update(
        section,
        workspacePath,
        vscode.ConfigurationTarget.Workspace
      );

      assert.strictEqual(configuration.getDoc8Path(resource), globalPath);
      assert.strictEqual(DefaultConfig().workspaceIsTrusted(), false);

      await vscode.commands.executeCommand(
        'restructuredtext.workspace.isTrusted.toggle'
      );
      await wait(100);

      assert.strictEqual(DefaultConfig().workspaceIsTrusted(), true);
      assert.strictEqual(configuration.getDoc8Path(resource), workspacePath);

      await vscode.commands.executeCommand(
        'restructuredtext.workspace.isTrusted.toggle'
      );
      await wait(100);

      assert.strictEqual(DefaultConfig().workspaceIsTrusted(), false);
      assert.strictEqual(configuration.getDoc8Path(resource), globalPath);
    } finally {
      await settings.update(
        section,
        originalGlobalValue,
        vscode.ConfigurationTarget.Global
      );
      await settings.update(
        section,
        originalWorkspaceValue,
        vscode.ConfigurationTarget.Workspace
      );

      if (DefaultConfig().workspaceIsTrusted() !== originalTrusted) {
        await vscode.commands.executeCommand(
          'restructuredtext.workspace.isTrusted.toggle'
        );
        await wait(100);
      }
    }
  });

  test('recommendation flow can fall back to linter guidance when Esbonio is skipped', async function () {
    if (vscode.extensions.getExtension('swyddfa.esbonio')) {
      this.skip();
    }

    const recommendedSection = 'recommendedExtensions';
    const disabledSection = 'pythonRecommendation.disabled';
    const settings = vscode.workspace.getConfiguration('restructuredtext');
    const recommendedInspect = settings.inspect(recommendedSection);
    const disabledInspect = settings.inspect<boolean>(disabledSection);

    try {
      await settings.update(
        recommendedSection,
        [
          {
            id: 'test.fake-extension',
            name: 'Fake Extension',
            reason: 'Used to exercise the review flow.',
          },
          {
            id: 'swyddfa.esbonio',
            name: 'Esbonio',
            reason: 'Provides language server features: autocompletion and live preview.',
          },
        ],
        vscode.ConfigurationTarget.Global
      );
      await settings.update(
        disabledSection,
        false,
        vscode.ConfigurationTarget.Global
      );

      resetRecommendationPrompts();
      queueRecommendationPromptResponses([
        'Review One By One',
        'Skip',
        'Skip',
        'Learn About Linters',
      ]);

      await triggerRecommendationFlow();

      const prompts = getRecommendationPrompts();
      const commands = getRecommendationCommands();
      const urls = getRecommendationUrls();

      assert.strictEqual(prompts.length, 4);
      assert.ok(
        prompts[0].message.includes('We recommend installing: Fake Extension, Esbonio')
      );
      assert.ok(
        prompts.some(prompt =>
          prompt.message.includes('Esbonio is optional. If you prefer not to install it')
        )
      );
      assert.deepStrictEqual(commands, []);
      assert.ok(
        urls.includes(
          'https://docs.restructuredtext.net/articles/configuration.html#linting'
        )
      );
    } finally {
      resetRecommendationPrompts();
      await settings.update(
        recommendedSection,
        recommendedInspect?.globalValue,
        vscode.ConfigurationTarget.Global
      );
      await settings.update(
        disabledSection,
        disabledInspect?.globalValue,
        vscode.ConfigurationTarget.Global
      );
    }
  });

  test('unsupported linter prompt respects Never Ask Again on later detections', async () => {
    const section = 'linter.installRecommendation.disabled';
    const settings = vscode.workspace.getConfiguration('restructuredtext');
    const inspect = settings.inspect<boolean>(section);

    try {
      await settings.update(
        section,
        false,
        vscode.ConfigurationTarget.Global
      );

      clearUnsupportedReleasePrompts();
      queueUpgradePromptResponses(['Never Ask Again']);

      const firstResult = await triggerUnsupportedReleasePrompt(
        'doc8',
        '0.11.2'
      );

      assert.strictEqual(firstResult, false);
      assert.deepStrictEqual(getDisplayedUnsupportedReleasePrompts(), ['doc8:0.11.2']);
      assert.strictEqual(
        configuration.getLinterInstallRecommendationDisabled(),
        true
      );

      clearUnsupportedReleasePrompts();

      const secondResult = await triggerUnsupportedReleasePrompt(
        'doc8',
        '0.11.1'
      );

      assert.strictEqual(secondResult, false);
      assert.deepStrictEqual(getDisplayedUnsupportedReleasePrompts(), []);
    } finally {
      clearUnsupportedReleasePrompts();
      await settings.update(
        section,
        inspect?.globalValue,
        vscode.ConfigurationTarget.Global
      );
    }
  });
});
