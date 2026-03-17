#!/usr/bin/env node
'use strict';

const {execSync} = require('child_process');
const fs = require('fs');
const path = require('path');

function runCommand(cmd) {
  try {
    return execSync(cmd, {encoding: 'utf8'}).trim();
  } catch (e) {
    return null;
  }
}

// Use git tags (no external GitVersion dependency) to determine version
function tryGitDescribe() {
  // prefer annotated tags: returns the most recent tag reachable from HEAD
  const out = runCommand('git describe --tags --abbrev=0');
  if (!out) return null;
  // strip leading v if present
  return out.replace(/^v/, '').trim();
}

function updatePackageJson(version) {
  const pkgPath = path.resolve(process.cwd(), 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const old = pkg.version;
  pkg.version = version;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  console.log(`Updated package.json version: ${old} -> ${version}`);
}

function main() {
  // Determine version from git tags (no external GitVersion tool required)
  let version = tryGitDescribe();

  if (!version) {
    console.error('Could not determine version from GitVersion or git tags.');
    process.exit(2);
  }

  // Ensure version is simple semver (strip pre-release metadata)
  version = version.split('-')[0];

  updatePackageJson(version);
}

main();
