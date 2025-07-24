/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {injectable} from 'inversify';
import {getSystemInfo} from './systemInfo';

export interface Logger {
    info(message: string): void;
    error(message: string): void;
    warning(message: string): void;
    debug(message: string): void;
    log(message: string): void;
    logPlatform(): Promise<void>;
    outputChannel: vscode.OutputChannel;
    updateConfiguration(): void;
    show(): void;
}

export enum Trace {
    Off,
    Verbose,
}

// eslint-disable-next-line @typescript-eslint/no-namespace
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

function isString(value: unknown): value is string {
    return Object.prototype.toString.call(value) === '[object String]';
}

@injectable()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class ConsoleLogger implements Logger {
    private trace?: Trace;
    public outputChannel: vscode.OutputChannel;

    constructor(name: string) {
        this.outputChannel = vscode.window.createOutputChannel(name);
        this.updateConfiguration();
    }

    public error(message: string): void {
        this.logWithCategory('ERROR', message);
    }

    public info(message: string): void {
        this.logWithCategory('INFO', message);
    }

    public debug(message: string): void {
        this.logWithCategory('DEBUG', message);
    }

    public warning(message: string): void {
        this.logWithCategory('WARNING', message);
    }

    private logWithCategory(
        category: string,
        message: string,
        data?: unknown
    ): void {
        const alwaysLog = category === 'ERROR' || category === 'WARNING' || category === 'INFO';
        if (alwaysLog || this.trace === Trace.Verbose) {
            this.appendLine(
                `[${category} - ${new Date().toLocaleTimeString()}] ${message}`
            );
            if (data) {
                this.appendLine(ConsoleLogger.data2String(data));
            }
        }
    }

    public log(message: string, data?: unknown): void {
        // For backward compatibility, treat as INFO
        this.logWithCategory('INFO', message, data);
    }

    public updateConfiguration() {
        this.trace = this.readTrace();
    }

    public appendLine(value = '') {
        return this.outputChannel.appendLine(value);
    }

    public append(value: string) {
        return this.outputChannel.append(value);
    }

    public show() {
        this.outputChannel.show();
    }

    private readTrace(): Trace {
        return Trace.fromString(
            vscode.workspace
                .getConfiguration()
                .get<string>('restructuredtext.trace', 'off')
        );
    }

    private static data2String(data: unknown): string {
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
        try {
            const systemInfo = getSystemInfo();
            const info = (await systemInfo.getInfo()) as {
                osInfo?: {
                    platform?: string;
                    distro?: string;
                    release?: string;
                    arch?: string;
                };
            };

            // Now use info safely regardless of platform
            this.info(
                `OS: ${info.osInfo?.platform || 'unknown'} ${
                    info.osInfo?.distro || ''
                } ${info.osInfo?.release || ''} ${info.osInfo?.arch || ''}`
            );
        } catch (err) {
            this.error(`Failed to get platform info: ${err}`);
        }
    }
}
