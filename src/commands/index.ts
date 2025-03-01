/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Re-export all commands with platform-agnostic implementations
export * from './moveCursor';
export * from './openDocumentLink';

// Conditionally export commands that rely on Node.js features
import * as vscode from 'vscode';

// Platform-agnostic command interfaces can be defined here or in a separate file
// to be implemented differently based on the environment
