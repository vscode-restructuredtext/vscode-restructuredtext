/* eslint-disable @typescript-eslint/naming-convention */
const TYPES = {
  Logger: Symbol.for('Logger'),
  Python: Symbol.for('Python'),
  Configuration: Symbol.for('Configuration'),
  Esbonio: Symbol.for('Esbonio'),
  FolderStatus: Symbol.for('FolderStatus'),
  FileStatus: Symbol.for('FileStatus'),
  FileSelector: Symbol.for('FileSelector'),
  PreviewContext: Symbol.for('PreviewContext'),
  RstEngine: Symbol.for('RstEngine'),
  ContentProvider: Symbol.for('ContentProvider'),
  PreviewManager: Symbol.for('PreviewManager'),
  Policy: Symbol.for('Policy'),
  SecuritySelector: Symbol.for('SecuritySelector'),
  SingleFolder: Symbol.for('SingleFolder'),
};

const NAMES = {
  Lsp: Symbol.for('Lsp'),
  Main: Symbol.for('Main'),
};

export {TYPES, NAMES};
