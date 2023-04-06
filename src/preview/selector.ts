'use strict';

import path = require('path');
import {Uri, window, workspace} from 'vscode';
import {Configuration} from '../util/configuration';
import {findConfigFiles, ConfigFileOption} from './configFinder';
import {Logger} from '../util/logger';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {NAMES, TYPES} from '../types';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {inject, injectable, named} from 'inversify';
import {Constants} from '../constants';
import {textConfigFileSelectedPostfix} from '../util/constants';
/**
 *
 */
@injectable()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class ConfigFileSelector {
  constructor(
    @inject(TYPES.Configuration) private configuration: Configuration,
    @inject(TYPES.Logger) @named(NAMES.Main) private logger: Logger
  ) {}

  public async findConfDir(
    inReset = false,
    resource: Uri
  ): Promise<ConfigFileOption> {
    const configurations: ConfigFileOption[] = [];
    const selected = this.configuration.getConfPath(resource);
    const workspaceRoot = workspace.getWorkspaceFolder(resource);
    const pathStrings: string[] = [];

    if (inReset || selected === '') {
      const pathsToAdd: string[] = await findConfigFiles(workspaceRoot!);
      for (const confPath of pathsToAdd) {
        const found = path.dirname(path.normalize(confPath));
        if (!pathStrings.includes(found)) {
          const option = new ConfigFileOption();
          option.label = `$(gear) Use config file in ${found}`;
          option.tooltip = `Full path ${found}. Click to reset.`;
          option.configDirectory = found;
          option.workspaceRoot = workspaceRoot!.uri.fsPath;
          option.engine = 'sphinx';
          option.shortLabel = `$(gear) Config file in ${shrink(found)}`;
          configurations.push(option);
          pathStrings.push(found);
        }
      }
    }

    this.logger.log(
      `[preview] Found $(textConfigFileName) in paths: ${JSON.stringify(
        pathStrings
      )}`
    );

    const fullPathSelected = path.normalize(selected);
    const configSelected = new ConfigFileOption();
    configSelected.label = `$(gear) Use config file in ${fullPathSelected}`;
    configSelected.tooltip = `Full path: ${fullPathSelected}. Click to reset.`;
    configSelected.description += textConfigFileSelectedPostfix;
    configSelected.configDirectory = fullPathSelected;
    configSelected.workspaceRoot = workspaceRoot?.uri.fsPath;
    configSelected.engine = 'sphinx';
    configSelected.shortLabel = `$(gear) Config file in ${shrink(
      fullPathSelected
    )}`;

    if (configurations.length === 0) {
      if (selected !== '') {
        configurations.push(configSelected);
      } else {
        const docutils = new ConfigFileOption();
        docutils.label = '$(code) Use docutils';
        docutils.tooltip = 'Click to reset';
        docutils.description = 'Do not use Sphinx, but docutils instead';
        docutils.configDirectory = '';
        docutils.engine = 'docutils';
        docutils.workspaceRoot = workspaceRoot?.uri.fsPath;
        docutils.shortLabel = docutils.label;
        configurations.push(docutils);
      }
    }

    if (configurations.length === 1) {
      if (inReset) {
        window.showInformationMessage(
          configurations[0].configDirectory === ''
            ? 'Docutils will be used to generate HTML from source files.'
            : 'A single config file detected. No other files to select from.'
        );
      }
      return configurations[0];
    }

    if (inReset) {
      // Found multiple conf.py files, let the user decide
      return window.showQuickPick(configurations, {
        placeHolder: 'Select how to generate HTML from source files',
      });
    }

    return configSelected;
  }
}

function shrink(path: string) {
  if (path.length < Constants.shrinkLength) {
    return path;
  }

  return `...${path.substring(
    path.length - Constants.shrinkLength + '...'.length
  )}`;
}
