/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';

import {Command} from '../util/commandManager';
import {RSTPreviewManager} from '../preview/previewManager';
import {PreviewSettings} from '../preview/preview';
import {Python} from '../util/python';

interface ShowPreviewSettings {
  readonly sideBySide?: boolean;
  readonly locked?: boolean;
}

async function showPreview(
  webviewManager: RSTPreviewManager,
  python: Python,
  uri: vscode.Uri | undefined,
  previewSettings: ShowPreviewSettings
): // eslint-disable-next-line @typescript-eslint/no-explicit-any
Promise<any> {
  let resource = uri;
  if (!(resource instanceof vscode.Uri)) {
    if (vscode.window.activeTextEditor) {
      // we are relaxed and don't check for rst files
      resource = vscode.window.activeTextEditor.document.uri;
    }
  }

  if (!(resource instanceof vscode.Uri)) {
    if (!vscode.window.activeTextEditor) {
      // this is most likely toggling the preview
      return vscode.commands.executeCommand('restructuredtext.showSource');
    }
    // nothing found that could be shown or toggled
    return;
  }

  if (
    !(await python.checkPython(resource)) ||
    !(await python.checkPreviewEngine(resource))
  ) {
    // no engine to use.
    return;
  }

  const resourceColumn =
    (vscode.window.activeTextEditor &&
      vscode.window.activeTextEditor.viewColumn) ||
    vscode.ViewColumn.One;
  webviewManager.preview(resource, {
    resourceColumn: resourceColumn,
    previewColumn: previewSettings.sideBySide
      ? resourceColumn + 1
      : resourceColumn,
    locked: !!previewSettings.locked,
  });
}

export class ShowPreviewCommand implements Command {
  public readonly id = 'restructuredtext.showPreview';

  public constructor(
    private readonly webviewManager: RSTPreviewManager,
    private readonly python: Python
  ) {}

  public execute(
    mainUri?: vscode.Uri,
    allUris?: vscode.Uri[],
    previewSettings?: PreviewSettings
  ) {
    for (const uri of Array.isArray(allUris) ? allUris : [mainUri]) {
      showPreview(this.webviewManager, this.python, uri, {
        sideBySide: false,
        locked: previewSettings && previewSettings.locked,
      });
    }
  }
}

export class ShowPreviewToSideCommand implements Command {
  public readonly id = 'restructuredtext.showPreviewToSide';

  public constructor(
    private readonly webviewManager: RSTPreviewManager,
    private readonly python: Python
  ) {}

  public execute(uri?: vscode.Uri, previewSettings?: PreviewSettings) {
    showPreview(this.webviewManager, this.python, uri, {
      sideBySide: true,
      locked: previewSettings && previewSettings.locked,
    });
  }
}

export class ShowLockedPreviewToSideCommand implements Command {
  public readonly id = 'restructuredtext.showLockedPreviewToSide';

  public constructor(
    private readonly webviewManager: RSTPreviewManager,
    private readonly python: Python
  ) {}

  public execute(uri?: vscode.Uri) {
    showPreview(this.webviewManager, this.python, uri, {
      sideBySide: true,
      locked: true,
    });
  }
}
