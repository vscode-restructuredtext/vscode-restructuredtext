/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import {Command} from '../util/commandManager';
import {RSTPreviewManager} from '../preview/previewManager';

export class ShowSourceCommand implements Command {
  public readonly id = 'restructuredtext.showSource';

  public constructor(private readonly previewManager: RSTPreviewManager) {}

  public execute() {
    if (this.previewManager.activePreviewResource) {
      return vscode.window.showTextDocument(
        this.previewManager.activePreviewResource
      );
    }
    return undefined;
  }
}
