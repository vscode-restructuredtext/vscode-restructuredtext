/* eslint-disable @typescript-eslint/naming-convention */
const TYPES = {
  Logger: Symbol.for('Logger'),
  Python: Symbol.for('Python'),
  Configuration: Symbol.for('Configuration'),
  Esbonio: Symbol.for('Esbonio'),
  TransformStatus: Symbol.for('TransformStatus'),
  TransformSelector: Symbol.for('TransformSelector'),
  PreviewContext: Symbol.for('PreviewContext'),
  RstEngine: Symbol.for('RstEngine'),
  ContentProvider: Symbol.for('ContentProvider'),
  PreviewManager: Symbol.for('PreviewManager'),
  Policy: Symbol.for('Policy'),
  SecuritySelector: Symbol.for('SecuritySelector'),
};

const NAMES = {
  Lsp: Symbol.for('Lsp'),
  Main: Symbol.for('Main'),
};

export {TYPES, NAMES};
