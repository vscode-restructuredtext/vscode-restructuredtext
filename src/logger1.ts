/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { lazy } from './util/lazy';

export enum Trace {
	Off,
	Verbose
}

export namespace Trace {
	export function fromString(value: string): Trace {
		value = value.toLowerCase();
		switch (value) {
			case 'off':
				return Trace.Off;
			case 'verbose':
				return Trace.Verbose;
			default:
				return Trace.Off;
		}
	}
}


function isString(value: any): value is string {
	return Object.prototype.toString.call(value) === '[object String]';
}

export class Logger1 {
	private trace?: Trace;

	private readonly outputChannel = lazy(() => vscode.window.createOutputChannel('RST'));

	constructor() {
		this.updateConfiguration();
	}

	public log(message: string, data?: any): void {
		if (this.trace === Trace.Verbose) {
			this.appendLine(`[Log - ${(new Date().toLocaleTimeString())}] ${message}`);
			if (data) {
				this.appendLine(Logger1.data2String(data));
			}
		}
	}

	public updateConfiguration() {
		this.trace = this.readTrace();
	}

	private appendLine(value: string) {
		return this.outputChannel.value.appendLine(value);
	}

	private readTrace(): Trace {
		return Trace.fromString(vscode.workspace.getConfiguration().get<string>('restructuredtext.trace', 'off'));
	}

	private static data2String(data: any): string {
		if (data instanceof Error) {
			if (isString(data.stack)) {
				return data.stack;
			}
			return (data as Error).message;
		}
		if (isString(data)) {
			return data;
		}
		return JSON.stringify(data, undefined, 2);
	}
}
