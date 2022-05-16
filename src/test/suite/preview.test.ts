//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from "assert";
import { RSTEngine } from "../../preview/rstEngine";
import * as path from "path";
import * as fs from "fs";
import {
  initialize,
  closeActiveWindows,
  openFile,
  samplePath,
  wait
} from "./initialize";
import { Python } from "../../util/python";
import { Logger } from "../../util/logger";
import container from "../../inversify.config";
import { TYPES } from "../../types";

// Defines a Mocha test suite to group tests of similar kind together
let engine: RSTEngine;
let python: Python;
let logger: Logger = {
  log: () => void 0,
  appendLine: () => void 0,
  updateConfiguration: () => void 0
} as any;

suite("Preview Tests", function() {
  suiteSetup(async function() {
    this.timeout(30000);
    try {
      await initialize();
      python = container.get<Python>(TYPES.Python);

      engine = new RSTEngine(python, logger, null, null);
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
    const val = await engine.preview(editor.document, null);
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
    const val = await engine.compile(path.join(samplePath, "docutils", "example1.rst"), editor.document.uri, true, null);
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
    const val = await engine.compile(path.join(samplePath, "sphinx", "index.rst"), editor.document.uri, false, null);
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
