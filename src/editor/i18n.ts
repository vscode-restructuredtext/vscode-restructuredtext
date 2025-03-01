// ============================================================
// Copyright (c) 2021 Tatsuya Nakamori. All rights reserved.
// See LICENSE in the project root for license information.
// ============================================================
import * as vscode from 'vscode';

const i18nFiles: {[key: string]: string} = {
    en: './../../package.nls.json',
};
const i18nData = getData();

export function localize(i18nKey: string): string {
    return i18nData[i18nKey];
}

function getData(): {[key: string]: string} {
    // Get locale ("en", "ja", etc..)
    const locale = vscode.env.language;

    // Load [package.nls[.xx].json] file
    let i18nJSON: {[key: string]: string};
    if (locale in i18nFiles) {
        i18nJSON = require(i18nFiles[locale]);
    } else {
        i18nJSON = require(i18nFiles['en']);
    }
    return i18nJSON;
}
