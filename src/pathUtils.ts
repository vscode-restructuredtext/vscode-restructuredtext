// This file provides path utilities that work in both Node.js and browser environments

let pathModule: any;

// Detect environment
if (typeof window !== 'undefined') {
  // Browser environment - use path-browserify
  pathModule = require('path-browserify');
} else {
  // Node.js environment
  pathModule = require('path');
}

export const path = pathModule;

// Common path operations used throughout the codebase
export function joinPath(...paths: string[]): string {
  return pathModule.join(...paths);
}

export function normalizePath(p: string): string {
  return pathModule.normalize(p);
}

export function getBasename(p: string, ext?: string): string {
  return pathModule.basename(p, ext);
}

export function getDirname(p: string): string {
  return pathModule.dirname(p);
}

export function getExtname(p: string): string {
  return pathModule.extname(p);
}
