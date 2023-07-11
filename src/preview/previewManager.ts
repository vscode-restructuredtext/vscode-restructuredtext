/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import {Logger} from '../util/logger';
import {disposeAll} from '../util/dispose';
import {RSTFileTopmostLineMonitor} from '../util/topmostLineMonitor';
import {RSTPreview, PreviewSettings} from './preview';
import {RSTPreviewConfigurationManager} from './previewConfig';
import {RSTContentProvider} from './previewContentProvider';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {inject, injectable, named} from 'inversify';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {NAMES, TYPES} from '../types';
import {PreviewContext} from './PreviewContext';

@injectable()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class RSTPreviewManager implements vscode.WebviewPanelSerializer {
    private static readonly rstPreviewActiveContextKey =
        'restructuredtextPreviewFocus';

    private readonly _topmostLineMonitor = new RSTFileTopmostLineMonitor();
    private readonly _previewConfigurations =
        new RSTPreviewConfigurationManager();
    private readonly _previews: RSTPreview[] = [];
    private _activePreview: RSTPreview | undefined = undefined;
    private readonly _disposables: vscode.Disposable[] = [];

    public constructor(
        @inject(TYPES.ContentProvider)
        private readonly _contentProvider: RSTContentProvider,
        @inject(TYPES.Logger)
        @named(NAMES.Main)
        private readonly _logger: Logger,
        @inject(TYPES.PreviewContext) private readonly context: PreviewContext
    ) {
        this._disposables.push(
            vscode.window.registerWebviewPanelSerializer(
                RSTPreview.viewType,
                this
            )
        );
    }

    public dispose(): void {
        disposeAll(this._disposables);
        disposeAll(this._previews);
    }

    public refresh() {
        for (const preview of this._previews) {
            preview.refresh();
        }
    }

    public updateConfiguration() {
        for (const preview of this._previews) {
            preview.updateConfiguration();
        }
    }

    public preview(
        resource: vscode.Uri,
        previewSettings: PreviewSettings
    ): void {
        let preview = this.getExistingPreview(resource, previewSettings);
        if (preview) {
            preview.reveal(previewSettings.previewColumn);
        } else {
            preview = this.createNewPreview(resource, previewSettings);
        }

        preview.update(resource);
    }

    public get activePreviewResource() {
        return this._activePreview && this._activePreview.resource;
    }

    public toggleLock() {
        const preview = this._activePreview;
        if (preview) {
            preview.toggleLock();

            // Close any previews that are now redundant, such as having two dynamic previews in the same editor group
            for (const otherPreview of this._previews) {
                if (otherPreview !== preview && preview.matches(otherPreview)) {
                    otherPreview.dispose();
                }
            }
        }
    }

    public async deserializeWebviewPanel(
        webview: vscode.WebviewPanel,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        state: any
    ): Promise<void> {
        const preview = await RSTPreview.revive(
            webview,
            state,
            this._contentProvider,
            this._previewConfigurations,
            this._logger,
            this.context.esbonio,
            this._topmostLineMonitor
        );

        this.registerPreview(preview);
    }

    private getExistingPreview(
        resource: vscode.Uri,
        previewSettings: PreviewSettings
    ): RSTPreview | undefined {
        return this._previews.find(preview =>
            preview.matchesResource(
                resource,
                previewSettings.previewColumn,
                previewSettings.locked
            )
        );
    }

    private createNewPreview(
        resource: vscode.Uri,
        previewSettings: PreviewSettings
    ): RSTPreview {
        const preview = RSTPreview.create(
            resource,
            previewSettings.previewColumn,
            previewSettings.locked,
            this._contentProvider,
            this._previewConfigurations,
            this._logger,
            this.context.esbonio,
            this._topmostLineMonitor
        );

        this.setPreviewActiveContext(true);
        this._activePreview = preview;
        return this.registerPreview(preview);
    }

    private registerPreview(preview: RSTPreview): RSTPreview {
        this._previews.push(preview);

        preview.onDispose(() => {
            const existing = this._previews.indexOf(preview);
            if (existing === -1) {
                return;
            }

            this._previews.splice(existing, 1);
            if (this._activePreview === preview) {
                this.setPreviewActiveContext(false);
                this._activePreview = undefined;
            }
        });

        preview.onDidChangeViewState(({webviewPanel}) => {
            disposeAll(
                this._previews.filter(
                    otherPreview =>
                        preview !== otherPreview &&
                        preview!.matches(otherPreview)
                )
            );
            this.setPreviewActiveContext(webviewPanel.active);
            this._activePreview = webviewPanel.active ? preview : undefined;
        });

        return preview;
    }

    private setPreviewActiveContext(value: boolean) {
        vscode.commands.executeCommand(
            'setContext',
            RSTPreviewManager.rstPreviewActiveContextKey,
            value
        );
    }
}
