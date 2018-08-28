'use strict';

import {
    workspace,
} from 'vscode';

export class Configuration {
    public static loadAnySetting<T>(
        configSection: string, defaultValue: T, header: string = 'restructuredtext',
    ): T {
        return workspace.getConfiguration(header, null).get(configSection, defaultValue);
    }

    public static async saveAnySetting<T>(
        configSection: string, value: T, header: string = 'restructuredtext',
    ): Promise<T> {
        await workspace.getConfiguration(header, null).update(configSection, value);
        return value;
    }

    public static loadSetting(
        configSection: string, defaultValue: string, header: string = 'restructuredtext', expand: boolean = true,
    ): string {
        const result = this.loadAnySetting<string>(configSection, defaultValue, header);
        if (expand && result != null) {
            return this.expandMacro(result);
        }
        return result;
    }

    public static async saveSetting(
        configSection: string, value: string, header: string = 'restructuredtext',
    ): Promise<string> {
        return await this.saveAnySetting<string>(configSection, value, header);
    }

    public static async setRoot() {
        const old = this.loadSetting('workspaceRoot', null);
        if (old.indexOf('${workspaceRoot}') > -1) {
            await this.saveSetting('workspaceRoot', this.expandMacro(old));
        }
    }

    private static expandMacro(input: string): string {
        return input.replace('${workspaceRoot}', workspace.rootPath);
    }
}
