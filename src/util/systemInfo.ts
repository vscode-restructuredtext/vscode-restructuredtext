import * as vscode from 'vscode';

// Define an interface that matches the functionality we need from system-info
export interface SystemInfo {
    getInfo(): Promise<unknown>;
    // Add other methods you use from system-info
}

// Create a null implementation for web
class WebSystemInfo implements SystemInfo {
    async getInfo() {
        return {
            osInfo: {platform: 'web', distro: 'browser'},
        };
    }
    // Implement other methods with appropriate web defaults
}

// Create the Node.js implementation that uses the actual module
class NodeSystemInfo implements SystemInfo {
    async getInfo() {
        const si = require('@jedithepro/system-info');
        return {
            osInfo: await si.osInfo(),
        };
    }
}

// Factory function that returns the appropriate implementation
export function getSystemInfo(): SystemInfo {
    // Detect if running in web or desktop environment
    if (vscode.env.uiKind === vscode.UIKind.Web) {
        return new WebSystemInfo();
    } else {
        return new NodeSystemInfo();
    }
}
