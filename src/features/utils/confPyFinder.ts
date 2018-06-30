'use strict';

import * as path from "path";
import * as fs from "fs";
import { workspace, window, OutputChannel, Uri } from "vscode";
import { Configuration } from "./configuration";

export class ConfPyFinder {
    public static async findConfDir(rstPath: string, channel: OutputChannel): Promise<string> {
        // Sanity check - the file we are previewing must exist
        if (!fs.existsSync(rstPath) || !fs.statSync(rstPath).isFile) {
            return Promise.reject("RST extension got invalid file name: " + rstPath);
        }

        let paths: string[] = [];

        // A path may be configured
        let confPathFromSettings = Configuration.loadSetting("confPath", null);
        if (confPathFromSettings != null) {
            channel.appendLine("Using Spinx conf.py path from " +
                "restructuredtext.confPath settings: " + confPathFromSettings);
            return Promise.resolve(confPathFromSettings);
        }

        // Add path to a directory containing conf.py if it is not already stored
        function addPaths(pathsToAdd: string[]) {
            pathsToAdd.forEach(confPath => {
                let pth = path.dirname(confPath);
                if (paths.indexOf(pth) == -1)
                    paths.push(pth);
            });
        }

        // Search for unique conf.py paths in the workspace and in parent
        // directories (useful when opening a single file, not a workspace)
        const paths1: string[] = await findConfPyFiles();
        const paths2: string[] = findConfPyFilesInParentDirs(rstPath);
        addPaths(paths1);
        addPaths(paths2);
        channel.appendLine("Found conf.py paths: " + JSON.stringify(paths));

        // Default to the workspace root path if nothing was found
        if (paths.length == 0)
            return Promise.resolve(workspace.rootPath);

        // Found only one conf.py, using that one
        if (paths.length == 1) {
            return Promise.resolve(paths[0]);
        }

        // Found multiple conf.py files, let the user decide
        return window.showQuickPick(paths, {
            placeHolder: `Select 1 of ${paths.length} Sphinx directories`
        });
    }
}

/**
 * Returns a list of conf.py files in the workspace
 */
function findConfPyFiles(): Thenable<string[]> {
    if (!workspace.workspaceFolders) {
        return Promise.resolve([]);
    }

    return workspace.findFiles(
            /*include*/ '{**/conf.py}',
            /*exclude*/ '{}',
            /*maxResults*/ 100)
        .then(urisToPaths);
}

function urisToPaths(uris: Uri[]): string[] {
    let paths: string[] = [];
    uris.forEach(uri => paths.push(uri.fsPath));
    return paths;
}

/**
 * Find conf.py files by looking at parent directories. Useful in case
 * a single rst file is opened without a workspace
 */
function findConfPyFilesInParentDirs(rstPath: string): string[] {
    let paths: string[] = [];

    // Walk the directory up from the RST file directory looking for the conf.py file
    let dirName = rstPath;
    while (true) {
        // Get the name of the parent directory
        let parentDir = path.normalize(dirName + "/..");

        // Check if we are at the root directory already to avoid an infinte loop
        if (parentDir == dirName)
            break;

        // Sanity check - the parent directory must exist
        if (!fs.existsSync(parentDir) || !fs.statSync(parentDir).isDirectory)
            break;

        // Check this directory for conf.py
        let confPath = path.join(parentDir, "conf.py");
        if (fs.existsSync(confPath) && fs.statSync(confPath).isFile)
            paths.push(confPath);

        dirName = parentDir;
    }
    return paths;
}