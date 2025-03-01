import * as vscode from 'vscode';
import { path } from '../pathUtils';

// Define interfaces for the operations we need
export interface FileSystemReader {
    readFile(path: string): Promise<string>;
    exists(path: string): Promise<boolean>;
    isDirectory(path: string): Promise<boolean>;
    readDirectory(path: string): Promise<string[]>;
}

// Web implementation using workspace filesystem API
class WebFileSystemReader implements FileSystemReader {
    async readFile(filePath: string): Promise<string> {
        try {
            const uri = vscode.Uri.parse(filePath);
            const content = await vscode.workspace.fs.readFile(uri);
            return Buffer.from(content).toString('utf8');
        } catch (err) {
            console.error(`Error reading file in web environment: ${err}`);
            throw err;
        }
    }

    async exists(filePath: string): Promise<boolean> {
        try {
            const uri = vscode.Uri.parse(filePath);
            await vscode.workspace.fs.stat(uri);
            return true;
        } catch {
            return false;
        }
    }

    async isDirectory(filePath: string): Promise<boolean> {
        try {
            const uri = vscode.Uri.parse(filePath);
            const stat = await vscode.workspace.fs.stat(uri);
            return (stat.type & vscode.FileType.Directory) === vscode.FileType.Directory;
        } catch {
            return false;
        }
    }

    async readDirectory(dirPath: string): Promise<string[]> {
        try {
            const uri = vscode.Uri.parse(dirPath);
            const entries = await vscode.workspace.fs.readDirectory(uri);
            return entries.map(entry => entry[0]);
        } catch (err) {
            console.error(`Error reading directory in web environment: ${err}`);
            return [];
        }
    }
}

// Node implementation using fs module
class NodeFileSystemReader implements FileSystemReader {
    private fs: any;

    constructor() {
        this.fs = require('fs').promises;
    }

    async readFile(filePath: string): Promise<string> {
        return this.fs.readFile(filePath, 'utf8');
    }

    async exists(filePath: string): Promise<boolean> {
        try {
            await this.fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    async isDirectory(filePath: string): Promise<boolean> {
        try {
            const stats = await this.fs.stat(filePath);
            return stats.isDirectory();
        } catch {
            return false;
        }
    }

    async readDirectory(dirPath: string): Promise<string[]> {
        return this.fs.readdir(dirPath);
    }
}

// Factory function to get the appropriate implementation
export function getFileSystem(): FileSystemReader {
    if (vscode.env.uiKind === vscode.UIKind.Web) {
        return new WebFileSystemReader();
    } else {
        return new NodeFileSystemReader();
    }
}

// Synchronous operations (only available in Node.js)
export function fileExistsSync(filePath: string): boolean {
    if (vscode.env.uiKind === vscode.UIKind.Web) {
        console.warn('Sync file operations not supported in web environment');
        return false;
    }
    
    try {
        const fs = require('fs');
        return fs.existsSync(filePath);
    } catch {
        return false;
    }
}

export function readFileSync(filePath: string): string {
    if (vscode.env.uiKind === vscode.UIKind.Web) {
        console.warn('Sync file operations not supported in web environment');
        return '';
    }
    
    try {
        const fs = require('fs');
        return fs.readFileSync(filePath, 'utf8');
    } catch (err) {
        console.error(`Error reading file: ${err}`);
        return '';
    }
}
