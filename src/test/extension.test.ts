//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import * as myExtension from "../extension";
import { RSTEngine } from "../rstEngine";
import * as path from "path";
import * as fs from "fs";
import {
  initialize,
  closeActiveWindows,
  openFile,
  samplePath,
  wait
} from "./initialize";
import { Python } from "../python";
import { Logger1 } from "../logger1";
import { RSTContentProvider } from '../features/previewContentProvider';

// Defines a Mocha test suite to group tests of similar kind together
let engine: RSTEngine;
let python: Python;
let logger: Logger1 = {
  log: () => void 0,
  updateConfiguration: () => void 0
} as any;
let channel: vscode.OutputChannel;
suite("Extension Tests", function() {
  suiteSetup(async function() {
    this.timeout(30000);
    try {
      await initialize();
      python = new Python(logger);
      await python.awaitReady();

      channel = vscode.window.createOutputChannel('reStructuredText');

      engine = new RSTEngine(python, logger, null, channel);
    } catch (e) {
      throw e;
    }
  });

  suiteTeardown(function(done) {
    closeActiveWindows().then(done, done);
  });
  teardown(function(done) {
    closeActiveWindows().then(done, done);
  });

  // test("Example 1 open", function(done) {
  // const vm = new myExtension.ViewManager();
  //     openFile(path.join(samplePath, "example1.rst")).then(editor => {
  //         vm.preview(editor.document.uri, false);
  //         done();
  //     });
  // });

  test("Example 1 full preview", async function() {
    this.timeout(30000);
    const editor = await openFile(path.join(samplePath, "example1.rst"));
    const val = await engine.preview(editor.document);
    // await vscode.commands.executeCommand("rst.showPreviewToSide");
    // await wait(2000);
    // if (!vscode.window.activeTextEditor) {
    //   throw new Error("Failed to preview");
    // }
    // const val = (vscode.window.activeTextEditor as vscode.TextEditor).document.getText();
    return new Promise((res, rej) => {
      fs.readFile(
        path.join(samplePath, "example1Full.html"),
        "utf8",
        (err, expected) => {
          if (err) {
            rej(err);
          }
          assert.equal(
            val.split(/\r?\n/).join("\n"),
            expected.split(/\r?\n/).join("\n"),
            "Preview Generated HTML does not match expected"
          );
          res();
        }
      );
    });
  });

  test("Example 1 to HTML", async function() {
    this.timeout(30000);
    const editor = await openFile(path.join(samplePath, "example1.rst"));
    const val = await engine.compile(path.join(samplePath, "example1.rst"), editor.document.uri, '');
    return new Promise((res, rej) => {
      fs.readFile(
        path.join(samplePath, "example1.html"),
        "utf8",
        (err, expected) => {
          if (err) {
            rej(err);
          }
          assert.equal(
            val.split(/\r?\n/).join("\n"),
            expected.split(/\r?\n/).join("\n"),
            "Generated HTML does not match expected"
          );
          res();
        }
      );
    });
  });

  test("Sphinx to HTML", async function() {
    this.timeout(30000);
    const editor = await openFile(path.join(samplePath, "sphinx", "index.rst"));
    const val = await engine.compile(path.join(samplePath, "sphinx", "index.rst"), editor.document.uri, path.join(samplePath, 'sphinx'));
    return new Promise((res, rej) => {
      fs.readFile(
        path.join(samplePath, "index.html"),
        "utf8",
        (err, expected) => {
          if (err) {
            rej(err);
          }
          assert.equal(
            val.split(/\r?\n/).join("\n"),
            expected.split(/\r?\n/).join("\n"),
            "Generated HTML does not match expected"
          );
          res();
        }
      );
    });
  });  
});
