/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Command } from '../commandManager';
import { RSTPreviewManager } from '../features/previewManager';

export class RefreshPreviewCommand implements Command {
	public readonly id = 'rst.preview.refresh';

	public constructor(
		private readonly webviewManager: RSTPreviewManager
	) { }

	public execute() {
		this.webviewManager.refresh();
	}
}