import * as path from 'path';
import * as vscode from 'vscode';
import assert = require('assert');
import * as fs from 'fs';

export const samplePath = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'test-resources'
);

async function checkValidFile(file: string): Promise<boolean> {
  return new Promise<boolean>((resolve, reject) => {
    fs.stat(file, (err, stats) => {
      if (err) {
        return reject(err);
      }
      assert(stats.isFile(), 'Not a valid file');
      resolve(true);
    });
  });
}

export async function initialize(): Promise<vscode.TextDocument> {
  const dummyFile = path.join(samplePath, 'docutils', 'example1.rst');
  await checkValidFile(dummyFile);
  return vscode.workspace.openTextDocument(dummyFile);
}

export async function openFile(file: string) {
  await checkValidFile(file);
  const document = await vscode.workspace.openTextDocument(file);
  return vscode.window.showTextDocument(document);
}

export async function closeActiveWindows(): Promise<any> {
  // https://github.com/Microsoft/vscode/blob/master/extensions/vscode-api-tests/src/utils.ts
  await new Promise(async (c, e) => {
    if (vscode.window.visibleTextEditors.length === 0) {
      return c(0);
    }

    // TODO: the visibleTextEditors variable doesn't seem to be
    // up to date after a onDidChangeActiveTextEditor event, not
    // even using a setTimeout 0... so we MUST poll :(
    const deadline = Date.now() + 2000;
    const interval = setInterval(() => {
      if (
        vscode.window.visibleTextEditors.length > 0 &&
        Date.now() < deadline
      ) {
        return;
      }

      clearInterval(interval);
      c(0);
    }, 10);

    try {
      await vscode.commands.executeCommand('workbench.action.closePanel');
      await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    } catch (e) {
      clearInterval(interval);
      e(e);
    }
  });
  if (vscode.window.visibleTextEditors.length > 0) {
    console.warn('Some editors could not be closed by the test harness.');
  }
}

export async function saveDocument(
  editor: vscode.TextEditor
): Promise<void> {
  const start = new vscode.Position(0, 0);
  await editor.edit(edit => edit.insert(start, ' '));
  await editor.edit(edit => edit.delete(new vscode.Range(0, 0, 0, 1)));
  await editor.document.save();
  await wait(100);
}

export function wait(time: number): Promise<void> {
  return new Promise(res => setTimeout(res, time));
}
