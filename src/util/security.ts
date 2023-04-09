/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';

import {RSTPreviewManager} from '../preview/previewManager';

import * as nls from 'vscode-nls';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {inject, injectable} from 'inversify';
import {PreviewContext} from '../preview/PreviewContext';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {TYPES} from '../types';

const localize = nls.loadMessageBundle();

export enum RSTPreviewSecurityLevel {
    Strict = 0,
    AllowInsecureContent = 1,
    AllowScriptsAndAllContent = 2,
    AllowInsecureLocalContent = 3,
}

export interface ContentSecurityPolicyArbiter {
    getSecurityLevelForResource(resource: vscode.Uri): RSTPreviewSecurityLevel;

    setSecurityLevelForResource(
        resource: vscode.Uri,
        level: RSTPreviewSecurityLevel
    ): Thenable<void>;

    shouldAllowSvgsForResource(resource: vscode.Uri): void;

    shouldDisableSecurityWarnings(): boolean;

    setShouldDisableSecurityWarning(shouldShow: boolean): Thenable<void>;
}

@injectable()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class ExtensionContentSecurityPolicyArbiter
    implements ContentSecurityPolicyArbiter
{
    private readonly old_trusted_workspace_key = 'trusted_preview_workspace:';
    private readonly security_level_key = 'preview_security_level:';
    private readonly should_disable_security_warning_key =
        'preview_should_show_security_warning:';

    constructor(
        @inject(TYPES.PreviewContext) private readonly context: PreviewContext
    ) {}

    public getSecurityLevelForResource(
        resource: vscode.Uri
    ): RSTPreviewSecurityLevel {
        // Use new security level setting first
        const level = this.context.extensionContext.globalState.get<
            RSTPreviewSecurityLevel | undefined
        >(this.security_level_key + this.getRoot(resource), undefined);
        if (typeof level !== 'undefined') {
            return level;
        }

        // Fallback to old trusted workspace setting
        if (
            this.context.extensionContext.globalState.get<boolean>(
                this.old_trusted_workspace_key + this.getRoot(resource),
                false
            )
        ) {
            return RSTPreviewSecurityLevel.AllowScriptsAndAllContent;
        }
        return RSTPreviewSecurityLevel.Strict;
    }

    public setSecurityLevelForResource(
        resource: vscode.Uri,
        level: RSTPreviewSecurityLevel
    ): Thenable<void> {
        return this.context.extensionContext.globalState.update(
            this.security_level_key + this.getRoot(resource),
            level
        );
    }

    public shouldAllowSvgsForResource(resource: vscode.Uri) {
        const securityLevel = this.getSecurityLevelForResource(resource);
        return (
            securityLevel === RSTPreviewSecurityLevel.AllowInsecureContent ||
            securityLevel === RSTPreviewSecurityLevel.AllowScriptsAndAllContent
        );
    }

    public shouldDisableSecurityWarnings(): boolean {
        return this.context.extensionContext.workspaceState.get<boolean>(
            this.should_disable_security_warning_key,
            false
        );
    }

    public setShouldDisableSecurityWarning(disabled: boolean): Thenable<void> {
        return this.context.extensionContext.workspaceState.update(
            this.should_disable_security_warning_key,
            disabled
        );
    }

    private getRoot(resource: vscode.Uri): vscode.Uri {
        if (vscode.workspace.workspaceFolders) {
            const folderForResource =
                vscode.workspace.getWorkspaceFolder(resource);
            if (folderForResource) {
                return folderForResource.uri;
            }

            if (vscode.workspace.workspaceFolders.length) {
                return vscode.workspace.workspaceFolders[0].uri;
            }
        }

        return resource;
    }
}

@injectable()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class PreviewSecuritySelector {
    public constructor(
        @inject(TYPES.Policy)
        private readonly cspArbiter: ContentSecurityPolicyArbiter,
        @inject(TYPES.PreviewManager)
        private readonly webviewManager: RSTPreviewManager
    ) {}

    public async showSecuritySelectorForResource(
        resource: vscode.Uri
    ): Promise<void> {
        interface PreviewSecurityPickItem extends vscode.QuickPickItem {
            readonly type: 'moreinfo' | 'toggle' | RSTPreviewSecurityLevel;
        }

        function markActiveWhen(when: boolean): string {
            return when ? '• ' : '';
        }

        const currentSecurityLevel =
            this.cspArbiter.getSecurityLevelForResource(resource);
        const selection =
            await vscode.window.showQuickPick<PreviewSecurityPickItem>(
                [
                    {
                        type: RSTPreviewSecurityLevel.Strict,
                        label:
                            markActiveWhen(
                                currentSecurityLevel ===
                                    RSTPreviewSecurityLevel.Strict
                            ) + localize('strict.title', 'Strict'),
                        description: localize(
                            'strict.description',
                            'Only load secure content'
                        ),
                    },
                    {
                        type: RSTPreviewSecurityLevel.AllowInsecureLocalContent,
                        label:
                            markActiveWhen(
                                currentSecurityLevel ===
                                    RSTPreviewSecurityLevel.AllowInsecureLocalContent
                            ) +
                            localize(
                                'insecureLocalContent.title',
                                'Allow insecure local content'
                            ),
                        description: localize(
                            'insecureLocalContent.description',
                            'Enable loading content over http served from localhost'
                        ),
                    },
                    {
                        type: RSTPreviewSecurityLevel.AllowInsecureContent,
                        label:
                            markActiveWhen(
                                currentSecurityLevel ===
                                    RSTPreviewSecurityLevel.AllowInsecureContent
                            ) +
                            localize(
                                'insecureContent.title',
                                'Allow insecure content'
                            ),
                        description: localize(
                            'insecureContent.description',
                            'Enable loading content over http'
                        ),
                    },
                    {
                        type: RSTPreviewSecurityLevel.AllowScriptsAndAllContent,
                        label:
                            markActiveWhen(
                                currentSecurityLevel ===
                                    RSTPreviewSecurityLevel.AllowScriptsAndAllContent
                            ) + localize('disable.title', 'Disable'),
                        description: localize(
                            'disable.description',
                            'Allow all content and script execution. Not recommended'
                        ),
                    },
                    {
                        type: 'moreinfo',
                        label: localize('moreInfo.title', 'More Information'),
                        description: '',
                    },
                    {
                        type: 'toggle',
                        label: this.cspArbiter.shouldDisableSecurityWarnings()
                            ? localize(
                                  'enableSecurityWarning.title',
                                  'Enable preview security warnings in this workspace'
                              )
                            : localize(
                                  'disableSecurityWarning.title',
                                  'Disable preview security warning in this workspace'
                              ),
                        description: localize(
                            'toggleSecurityWarning.description',
                            'Does not affect the content security level'
                        ),
                    },
                ],
                {
                    placeHolder: localize(
                        'preview.showPreviewSecuritySelector.title',
                        'Select security settings for RST previews in this workspace'
                    ),
                }
            );
        if (!selection) {
            return;
        }

        if (selection.type === 'moreinfo') {
            vscode.commands.executeCommand(
                'vscode.open',
                vscode.Uri.parse(
                    'https://go.microsoft.com/fwlink/?linkid=854414'
                )
            );
            return;
        }

        if (selection.type === 'toggle') {
            this.cspArbiter.setShouldDisableSecurityWarning(
                !this.cspArbiter.shouldDisableSecurityWarnings()
            );
            return;
        } else {
            await this.cspArbiter.setSecurityLevelForResource(
                resource,
                selection.type
            );
        }
        this.webviewManager.refresh();
    }
}
