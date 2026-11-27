import * as assert from 'assert';
import * as vscode from 'vscode';

import container from '../../inversify.config';
import {TYPES} from '../../types';
import {Configuration} from '../../util/configuration';
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

suite('Activation Integration Tests', function () {
  this.timeout(120000);

  suiteSetup(async function () {
    if (process.env.RST_LINTER_TESTS !== '1') {
      this.skip();
    }
    await vscode.extensions
      .getExtension('lextudio.restructuredtext')
      ?.activate();
  });

  const configuration = container.get<Configuration>(TYPES.Configuration);

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
      await settings.update(
        section,
        false,
        vscode.ConfigurationTarget.Workspace
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
      await settings.update(
        section,
        inspect?.workspaceValue,
        vscode.ConfigurationTarget.Workspace
      );
    }
  });
});
