'use strict';

import * as fs from 'fs';
import * as path from 'path';
import { QuickPickItem, Uri, workspace } from 'vscode';

/**
 * Configuration for how to transform rst files to html. Either use Sphinx
 * with a gven conf.py file, or use docutils without any configuration
 */
export class RstTransformerConfig implements QuickPickItem {
    public label: string;
    public description: string = 'Use Sphinx with the selected conf.py path';
    public confPyDirectory: string;
    public workspaceRoot: string;
}

/**
 * Returns a list of conf.py files in the workspace
 */
export async function findConfPyFiles(resource: Uri): Promise<string[]> {
    if (!workspace.workspaceFolders) {
        return [];
    }

    const items = await workspace.findFiles(
            /*include*/ '{**/conf.py}',
            /*exclude*/ '{}',
            /*maxResults*/ 100);
    return urisToPaths(items, resource);
}

function urisToPaths(uris: Uri[], resource: Uri): string[] {
    const paths: string[] = [];
    const workspaceFolder = workspace.getWorkspaceFolder(resource);
    uris.forEach((uri) => {
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
export function findConfPyFilesInParentDirs(rstPath: string): string[] {
    const paths: string[] = [];

    // Walk the directory up from the RST file directory looking for the conf.py file
    let dirName = rstPath;
    while (true) {
        // Get the name of the parent directory
        const parentDir = path.normalize(dirName + '/..');

        // Check if we are at the root directory already to avoid an infinte loop
        if (parentDir === dirName) {
            break;
        }

        // Sanity check - the parent directory must exist
        if (!fs.existsSync(parentDir) || !fs.statSync(parentDir).isDirectory) {
            break;
        }

        // Check this directory for conf.py
        const confPath = path.join(parentDir, 'conf.py');
        if (fs.existsSync(confPath) && fs.statSync(confPath).isFile) {
            paths.push(confPath);
        }

        dirName = parentDir;
    }

    return paths;
}
