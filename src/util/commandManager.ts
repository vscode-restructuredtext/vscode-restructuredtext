/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';

export interface Command {
    readonly id: string;
    execute(...args: any[]): void;
}

export class CommandManager implements vscode.Disposable {
    private readonly commands = new Map<string, vscode.Disposable>();

    public register<T extends Command>(command: T): T {
        this.registerCommand(command.id, command.execute, command);
        return command;
    }

    private registerCommand(
        id: string,
        impl: (...args: any[]) => void,
        thisArg?: any
    ) {
        if (this.commands.has(id)) {
            return;
        }

        this.commands.set(
            id,
            vscode.commands.registerCommand(id, impl, thisArg)
        );
    }

    public dispose(): void {
        for (const registration of this.commands.values()) {
            registration.dispose();
        }
        this.commands.clear();
    }
}

// Add platform detection utility for commands that need different behavior
export function isPlatformWeb(): boolean {
    return vscode.env.uiKind === vscode.UIKind.Web;
}

// Create a decorator that can be used to mark commands as web-compatible or not
export function webCommand(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function(...args: any[]) {
        // This runs in both environments
        return originalMethod.apply(this, args);
    };
    return descriptor;
}

export function desktopCommand(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function(...args: any[]) {
        // Check if we're in a web environment
        if (isPlatformWeb()) {
            vscode.window.showInformationMessage('This command is not available in web mode');
            return;
        }
        // Only run in desktop environment
        return originalMethod.apply(this, args);
    };
    return descriptor;
}
