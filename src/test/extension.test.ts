//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
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
import { Logger, Trace } from "../logger";

// Defines a Mocha test suite to group tests of similar kind together
let engine: RSTEngine;
let python: Python;
let logger = {
  append() {},
  appendLine() {},
  show() {},
  hide() {},
  log() {},
  updateConfiguration() {},
  readTrace() { return Trace.Off }
} as { [P in keyof Logger]: Logger[P] } as Logger

suite("Extension Tests", function() {
  suiteSetup(async function() {
    this.timeout(30000);
    try {
      await initialize();
      python = new Python(logger);

      engine = new RSTEngine(python, logger, null);
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

  test("Example 1 full preview", async function() {
    this.timeout(30000);
    const editor = await openFile(path.join(samplePath, "docutils", "example1.rst"));
    const val = await engine.preview(editor.document);
    return new Promise((res, rej) => {
      fs.readFile(
        path.join(samplePath, "docutils", "example1Full.html"),
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
    const editor = await openFile(path.join(samplePath, "docutils", "example1.rst"));
    const val = await engine.compile(editor.document, '', true);
    return new Promise((res, rej) => {
      fs.readFile(
        path.join(samplePath, "docutils", "example1.html"),
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
    const val = await engine.compile(editor.document, path.join(samplePath, 'sphinx'), false);
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
