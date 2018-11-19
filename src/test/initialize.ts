import * as path from "path";
import * as vscode from "vscode";
import * as assert from "assert";
import * as fs from "fs";

export const samplePath = path.join(__dirname, "..", "..", "test-resources");

async function checkValidFile(file: string): Promise<boolean> {
  return new Promise<boolean>((resolve, reject) => {
    fs.stat(file, (err, stats) => {
      if (err) {
        return reject(err);
      }
      assert(stats.isFile(), "Not a valid file");
      resolve(true);
    });
  });
}

export async function initialize(): Promise<vscode.TextDocument> {
  let dummyFile = path.join(samplePath, "docutils", "example1.rst");
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
      return c();
    }

    // TODO: the visibleTextEditors variable doesn't seem to be
    // up to date after a onDidChangeActiveTextEditor event, not
    // even using a setTimeout 0... so we MUST poll :(
    let interval = setInterval(() => {
      if (vscode.window.visibleTextEditors.length > 0) {
        return;
      }

      clearInterval(interval);
      c();
    }, 10);

    try {
      await vscode.commands.executeCommand("workbench.action.closeAllEditors");
    } catch (e) {
      clearInterval(interval);
      e(e);
    }
  });
  assert.equal(vscode.window.visibleTextEditors.length, 0);
  assert(!vscode.window.activeTextEditor);
}

export function wait(time: number): Promise<void> {
  return new Promise(res => setTimeout(res, time));
}
