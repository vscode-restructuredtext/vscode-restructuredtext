/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Command } from '../util/commandManager';
import { RSTPreviewManager } from '../preview/previewManager';

export class ToggleLockCommand implements Command {
	public readonly id = 'restructuredtext.preview.toggleLock';

	public constructor(
		private readonly previewManager: RSTPreviewManager
	) { }

	public execute() {
		this.previewManager.toggleLock();
	}
}