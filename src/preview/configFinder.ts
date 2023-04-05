'use strict';

import fs = require('fs');
import path = require('path');
import {QuickPickItem, Uri, WorkspaceFolder, workspace} from 'vscode';
import {
  textConfigFileDescription,
  textConfigFileName,
  textFindExclude,
  textFindInclude,
} from '../util/constants';

/**
 * Configuration for how to transform rst files to html. Either use Sphinx
 * with a gven conf.py file, or use docutils without any configuration
 */
export class ConfigFileOption implements QuickPickItem {
  public label: string;
  public tooltip: string;
  public description: string = textConfigFileDescription;
  public configDirectory: string;
  public engine: string;
  public workspaceRoot: string;
  public shortLabel: string;
}

/**
 * Returns a list of conf.py files in the workspace
 */
export async function findConfigFiles(
  root: WorkspaceFolder
): Promise<string[]> {
  const items = await workspace.findFiles(
    /*include*/ textFindInclude,
    /*exclude*/ textFindExclude,
    /*maxResults*/ 100
  );
  return urisToPaths(items, root);
}

function urisToPaths(uris: Uri[], root: WorkspaceFolder): string[] {
  const paths: string[] = [];
  const workspaceFolder = root;
  uris.forEach(uri => {
    const folder = workspace.getWorkspaceFolder(uri);
    if (folder === workspaceFolder) {
      paths.push(uri.fsPath);
    }
  });
  return paths;
}

/**
 * Find conf.py files by looking at parent directories. Useful in case
 * a single rst file is opened without a workspace
 */
export function findConfigFilesInParentDirs(rstPath: string): string[] {
  const paths: string[] = [];

  // Walk the directory up from the RST file directory looking for the conf.py file
  let dirName = rstPath;
  let parentDir = path.normalize(dirName + '/..');
  while (parentDir !== dirName) {
    // Sanity check - the parent directory must exist
    if (!fs.existsSync(parentDir) || !fs.statSync(parentDir).isDirectory) {
      break;
    }

    // Check this directory for conf.py
    const confPath = path.join(parentDir, textConfigFileName);
    if (fs.existsSync(confPath) && fs.statSync(confPath).isFile) {
      paths.push(confPath);
    }

    dirName = parentDir;
    parentDir = path.normalize(dirName + '/..');
  }

  return paths;
}
