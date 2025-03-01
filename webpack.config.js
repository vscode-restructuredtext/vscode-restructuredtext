const path = require('path');

module.exports = function(env, argv) {
  const config = {
    target: 'node', // vscode extensions run in a Node.js-context
    externals: {
      vscode: 'commonjs vscode', // the vscode-module is created on-the-fly and must be excluded
    },
  };
  
  // Create a web compatible version as well
  const webExtensionConfig = {
    mode: 'none', // this leaves the source code as close as possible to the original
    target: 'webworker', // extensions run in a webworker context
    entry: './src/extension.ts',
    output: {
      filename: 'extension-web.js',
      path: path.resolve(__dirname, 'dist'),
      libraryTarget: 'commonjs',
      devtoolModuleFilenameTemplate: '../../[resource-path]'
    },
    resolve: {
      mainFields: ['browser', 'module', 'main'],
      extensions: ['.ts', '.js'],
      fallback: {
        // Provide empty implementations for Node.js modules not available in the web
        path: require.resolve('path-browserify'),
        fs: false,
        child_process: false,
      }
    },
    module: {
      rules: [{
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [{
          loader: 'ts-loader'
        }]
      }]
    },
    externals: {
      vscode: 'commonjs vscode'
    },
    devtool: 'nosources-source-map',
    infrastructureLogging: {
      level: "log", // enables logging required for problem matchers
    },
  };
  
  return [config, webExtensionConfig];
};
