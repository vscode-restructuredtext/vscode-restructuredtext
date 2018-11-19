'use strict';

import * as fs from 'fs';
import * as path from 'path';
import { OutputChannel, Uri, window } from 'vscode';
import { Configuration } from './configuration';
import { findConfPyFiles, findConfPyFilesInParentDirs, RstTransformerConfig } from './confPyFinder';
/**
 *
 */
export class RstTransformerSelector {
    public static async findConfDir(resource: Uri, channel: OutputChannel): Promise<RstTransformerConfig> {
        const rstPath = resource.fsPath;
        // Sanity check - the file we are previewing must exist
        if (!fs.existsSync(rstPath) || !fs.statSync(rstPath).isFile) {
            return Promise.reject('RST extension got invalid file name: ' + rstPath);
        }
        const configurations: RstTransformerConfig[] = [];
        const pathStrings: string[] = [];
        // A path may be configured in the settings. Include this path
        const confPathFromSettings = Configuration.loadSetting('confPath', null, resource);

        const docutils = new RstTransformerConfig();
        docutils.label = '$(code) Use docutils';
        docutils.description = 'Do not use Sphinx, but docutils instead';
        docutils.confPyDirectory = '';

        if (confPathFromSettings != null) {
            if (confPathFromSettings === '') {
                return docutils;
            }

            const pth = path.join(path.normalize(confPathFromSettings), 'conf.py');
            const qpSettings = new RstTransformerConfig();
            qpSettings.label = '$(gear) Sphinx: ' + pth;
            qpSettings.description += ' (from restructuredtext.confPath setting)';
            qpSettings.confPyDirectory = path.dirname(pth);
            return qpSettings;
        }
        // Add path to a directory containing conf.py if it is not already stored
        function addPaths(pathsToAdd: string[]) {
            pathsToAdd.forEach((confPath) => {
                const pth = path.normalize(confPath);
                if (pathStrings.indexOf(pth) === -1) {
                    const qp = new RstTransformerConfig();
                    qp.label = '$(gear) Sphinx: ' + pth;
                    qp.confPyDirectory = path.dirname(pth);
                    configurations.push(qp);
                    pathStrings.push(pth);
                }
            });
        }
        // Search for unique conf.py paths in the workspace and in parent
        // directories (useful when opening a single file, not a workspace)
        const paths1: string[] = await findConfPyFiles(resource);
        const paths2: string[] = findConfPyFilesInParentDirs(rstPath);
        addPaths(paths1);
        addPaths(paths2);
        channel.appendLine('Found conf.py paths: ' + JSON.stringify(pathStrings));
        if (configurations.length === 1) {
            // only one conf.py.
            return configurations[0];
        }

        // The user can choose to use docutils instead of Sphinx
        configurations.push(docutils);
        if (configurations.length === 1) {
            // no conf.py.
            return configurations[0];
        }

        // Found multiple conf.py files, let the user decide
        return window.showQuickPick(configurations, {
            placeHolder: 'Select how to generate html from rst files',
        });
    }
}
