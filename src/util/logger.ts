/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { injectable } from 'inversify';

export interface Logger {
	info(message: string): void;
	error(message: string): void;
	warning(message: string): void;
	debug(message: string): void;
	log(message: string): void;
	logPlatform(): void;
	outputChannel: vscode.OutputChannel;
	updateConfiguration(): void;
}

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

@injectable()
export class ConsoleLogger implements Logger {
    private trace?: Trace;
	public outputChannel: vscode.OutputChannel;

	constructor(name: string) {
		this.outputChannel = vscode.window.createOutputChannel(name);
        this.updateConfiguration();
 	}

	public error(message: string): void {
		this.log(message);
	}

	public info(message: string): void {
		this.log(message);
	}

	public debug(message: string): void {
		this.log(message);
	}

	public warning(message: string): void {
		this.log(message);
	}

	public log(message: string, data?: any): void {
		if (this.trace === Trace.Verbose) {
			this.appendLine(`[Log - ${(new Date().toLocaleTimeString())}] ${message}`);
			if (data) {
				this.appendLine(ConsoleLogger.data2String(data));
			}
		}
    }

	public updateConfiguration() {
		this.trace = this.readTrace();
	}

	public appendLine(value: string = '') {
		return this.outputChannel.appendLine(value);
	}

	public append(value: string) {
		return this.outputChannel.append(value);
	}

	public show() {
		this.outputChannel.show();
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

	public async logPlatform(): Promise<void> {
		const os = require('os');
		let platform = os.platform();
		this.log(`OS is ${platform}`);
		if (platform === 'darwin' || platform === 'win32') {
			return;
		}
	
		const osInfo = require('linux-os-info');
		const result = await osInfo();
		const dist = result.id;
		this.log(`dist: ${dist}`);
	}
}
