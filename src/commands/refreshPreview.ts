/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Command } from '../util/commandManager';
import { RSTPreviewManager } from '../preview/previewManager';

export class RefreshPreviewCommand implements Command {
	public readonly id = 'restructuredtext.preview.refresh';

	public constructor(
		private readonly webviewManager: RSTPreviewManager
	) { }

	public execute() {
		this.webviewManager.refresh();
	}
}