/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CspAlerter } from './csp';

declare global {
	interface Window {
		cspAlerter: CspAlerter;
	}
}

window.cspAlerter = new CspAlerter();