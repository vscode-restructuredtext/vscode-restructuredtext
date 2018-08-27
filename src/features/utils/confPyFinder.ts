'use strict';

import * as path from "path";
import * as fs from "fs";
import { workspace, window, OutputChannel, Uri, QuickPickItem } from "vscode";
import { Configuration } from "./configuration";


/**
 * Configuration for how to transform rst files to html. Either use Sphinx
 * with a gven conf.py file, or use rst2html without any configuration
 */
export class RstTransformerConfig implements QuickPickItem {
    public label: string;
    public description: string = "Use Sphinx with the selected conf.py path";
    public confPyDirectory: string;
}

/**
 * 
 */
export class RstTransformerSelector {
    public static async findConfDir(rstPath: string, channel: OutputChannel): Promise<RstTransformerConfig> {
        // Sanity check - the file we are previewing must exist
        if (!fs.existsSync(rstPath) || !fs.statSync(rstPath).isFile) {
            return Promise.reject("RST extension got invalid file name: " + rstPath);
        }

        let configurations: RstTransformerConfig[] = [];
        let pathStrings: string[] = [];

        // A path may be configured in the settings. Include this path
        let confPathFromSettings = Configuration.loadSetting("confPath", null);
        if (confPathFromSettings != null) {
            if (confPathFromSettings == "")
            {
                let qpRstToHtml = new RstTransformerConfig();
                qpRstToHtml.label = "$(code) Use rst2html.py";
                qpRstToHtml.description = "Do not use Sphinx, but rst2html.py instead";
                qpRstToHtml.confPyDirectory = "";
                return Promise.resolve(qpRstToHtml);
            }

            let pth = path.join(path.normalize(confPathFromSettings), "conf.py");
            let qpSettings = new RstTransformerConfig();
            qpSettings.label = "$(gear) Sphinx: " + pth;
            qpSettings.description += " (from restructuredtext.confPath setting)";
            qpSettings.confPyDirectory = path.dirname(pth);
            return Promise.resolve(qpSettings);
        }

        // Add path to a directory containing conf.py if it is not already stored
        function addPaths(pathsToAdd: string[]) {
            pathsToAdd.forEach(confPath => {
                let pth = path.normalize(confPath);
                if (pathStrings.indexOf(pth) == -1) {
                    let qp = new RstTransformerConfig();
                    qp.label = "$(primitive-dot) Sphinx: " + pth;
                    qp.confPyDirectory = path.dirname(pth);
                    configurations.push(qp);
                    pathStrings.push(pth);
                }
            });
        }

        // Search for unique conf.py paths in the workspace and in parent
        // directories (useful when opening a single file, not a workspace)
        const paths1: string[] = await findConfPyFiles();
        const paths2: string[] = findConfPyFilesInParentDirs(rstPath);
        addPaths(paths1);
        addPaths(paths2);
        channel.appendLine("Found conf.py paths: " + JSON.stringify(pathStrings));

        // The user can chose to use rst2hml.py instead of Sphinx
        let qpRstToHtml = new RstTransformerConfig();
        qpRstToHtml.label = "$(code) Use rst2html.py";
        qpRstToHtml.description = "Do not use Sphinx, but rst2html.py instead";
        qpRstToHtml.confPyDirectory = "";
        configurations.push(qpRstToHtml);

        if (configurations.length == 1)
            return Promise.resolve(configurations[0]);

        // Found multiple conf.py files, let the user decide
        return window.showQuickPick(configurations, {
            placeHolder: "Select how to generate html from rst files"
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