# Working with the reStructuredText extension code

1. Clone the repo to a local path such as `~/vscode-restructuredtext`.
1. Navigate to this folder.
1. Resolve NPM dependencies via `npm install`.
1. Build via `npm run compile`.
1. Install Python and DocUtils via `pip install docutils`.
1. Run VS Code from this folder via `code .`.
1. In this editing VS Code instance, press F5 to start a debugging instance.
```
cd ~
git clone https://github.com/lextm/vscode-restructuredtext.git
cd ~/vscode-restructuredtext
npm install
npm run compile
code .
```

Note that to configure the `code` command, please follow [this guide](https://code.visualstudio.com/Docs/editor/setup).