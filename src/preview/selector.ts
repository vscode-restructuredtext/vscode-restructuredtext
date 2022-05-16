'use strict';

import * as fs from 'fs';
import * as path from 'path';
import { Uri, window } from 'vscode';
import { Configuration } from '../util/configuration';
import { findConfPyFiles, findConfPyFilesInParentDirs, RstTransformerConfig } from './confPyFinder';
import { Logger } from '../util/logger';
import { NAMES, TYPES } from '../types';
import { inject, injectable, named } from 'inversify';
import { Constants } from '../constants';
/**
 *
 */
@injectable()
export class RstTransformerSelector {

    constructor(
        @inject(TYPES.Configuration) private configuration: Configuration,
        @inject(TYPES.Logger) @named(NAMES.Main) private logger: Logger,
    ) {
    }

    public async findConfDir(resource: Uri, inReset: boolean = false): Promise<RstTransformerConfig> {
        const rstPath = resource.fsPath;
        // Sanity check - the file we are previewing must exist
        if (!fs.existsSync(rstPath) || !fs.statSync(rstPath).isFile) {
            return Promise.reject('RST extension got invalid file name: ' + rstPath);
        }
        const configurations: RstTransformerConfig[] = [];
        const pathStrings: string[] = [];
        // A path may be configured in the settings. Include this path
        const confPathFromSettings = this.configuration.getConfPath(resource);
        const workspaceRoot = this.configuration.getRootPath(resource);

        const docutils = new RstTransformerConfig();
        docutils.label = '$(code) Use docutils';
        docutils.tooltip = 'Click to reset';
        docutils.description = 'Do not use Sphinx, but docutils instead';
        docutils.confPyDirectory = '';
        docutils.engine = 'docutils'
        docutils.workspaceRoot = workspaceRoot;
        docutils.shortLabel = docutils.label;

        if (!inReset) {
            if (confPathFromSettings === '') {
                return docutils;
            }

            const pth = path.join(path.normalize(confPathFromSettings), 'conf.py');
            const qpSettings = new RstTransformerConfig();
            qpSettings.label = `\$(gear) Sphinx: ${pth}`;
            qpSettings.tooltip = `Click to reset. Full path: ${pth}`;
            qpSettings.description += ' (from restructuredtext.confPath setting)';
            qpSettings.confPyDirectory = path.dirname(pth);
            qpSettings.workspaceRoot = workspaceRoot;
            qpSettings.engine = 'sphinx';
            qpSettings.shortLabel = `\$(gear) Sphinx: ${this.shrink(pth)}`;

            return qpSettings;
        }
        // Add path to a directory containing conf.py if it is not already stored
        // Search for unique conf.py paths in the workspace and in parent
        // directories (useful when opening a single file, not a workspace)
        const paths1: string[] = await findConfPyFiles(resource);
        const paths2: string[] = findConfPyFilesInParentDirs(rstPath);
        this.addPaths(paths1, pathStrings, configurations, workspaceRoot);
        this.addPaths(paths2, pathStrings, configurations, workspaceRoot);
        this.logger.log('[preview] Found conf.py paths: ' + JSON.stringify(pathStrings));

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

    private addPaths(pathsToAdd: string[], pathStrings: string[], options: RstTransformerConfig[], workspaceRoot: string) {
        pathsToAdd.forEach((confPath) => {
            const pth = path.normalize(confPath);
            if (pathStrings.indexOf(pth) === -1) {
                const qp = new RstTransformerConfig();
                qp.label = `\$(gear) Sphinx: ${pth}`;
                qp.tooltip = `Click to reset. Full path: ${pth}`;
                qp.confPyDirectory = path.dirname(pth);
                qp.workspaceRoot = workspaceRoot;
                qp.engine = 'sphinx';
                qp.shortLabel = `\$(gear) Sphinx: ${this.shrink(pth)}`;

                options.push(qp);
                pathStrings.push(pth);
            }
        });
    }

    private shrink(path: string) {
        if (path.length < Constants.shrinkLength) {
            return path;
        }

        return `...${path.substring(path.length - Constants.shrinkLength + '...'.length)}`;
    }
}
