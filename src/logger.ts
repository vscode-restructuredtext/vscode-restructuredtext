import { Configuration } from './features/utils/configuration';
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { lazy } from './util/lazy';
import { TelemetryClient } from 'applicationinsights';

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

export class Logger {
    private trace?: Trace;
    private client: TelemetryClient;

	private readonly outputChannel = lazy(() => vscode.window.createOutputChannel('reStructuredText'));

	constructor() {
        this.updateConfiguration();
        const appInsights = require('applicationinsights');
        if (!Configuration.getTelemetryDisabled()) {
            appInsights.setup('21de4b5e-cb53-4161-b5c7-11cbeb7b3e2a')
                .setAutoDependencyCorrelation(true)
                .setAutoCollectRequests(false)
                .setAutoCollectPerformance(true, true)
                .setAutoCollectExceptions(true)
                .setAutoCollectDependencies(true)
                .setAutoCollectConsole(true)
                .setUseDiskRetryCaching(true)
                .setSendLiveMetrics(false)
                .setDistributedTracingMode(appInsights.DistributedTracingModes.AI)
                .start();
            this.client = appInsights.defaultClient;
        }
	}

	public log(message: string, data?: any): void {
		if (this.trace === Trace.Verbose) {
			this.appendLine(`[Log - ${(new Date().toLocaleTimeString())}] ${message}`);
			if (data) {
				this.appendLine(Logger.data2String(data));
			}
		}
    }
    
    public telemetry(message: string): void {
        this.client?.trackTrace({message});
    }

	public updateConfiguration() {
		this.trace = this.readTrace();
	}

	public appendLine(value: string = '') {
		return this.outputChannel.value.appendLine(value);
	}

	public append(value: string) {
		return this.outputChannel.value.append(value);
	}

	public show() {
		this.outputChannel.value.show();
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
