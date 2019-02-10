# reStructuredText Language Support for Visual Studio Code

[![Gitter](https://badges.gitter.im/vscode-restructuredtext/vscode-restructuredtext.svg)](https://gitter.im/vscode-restructuredtext/vscode-restructuredtext?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)
[![Current Version](https://vsmarketplacebadge.apphb.com/version/lextudio.restructuredtext.svg)](https://marketplace.visualstudio.com/items?itemName=lextudio.restructuredtext)
[![Install Count](https://vsmarketplacebadge.apphb.com/installs/lextudio.restructuredtext.svg)](https://marketplace.visualstudio.com/items?itemName=lextudio.restructuredtext)
[![Download Count](https://vsmarketplacebadge.apphb.com/downloads/lextudio.restructuredtext.svg)](https://marketplace.visualstudio.com/items?itemName=lextudio.restructuredtext)
[![Build Status](https://dev.azure.com/lextudio/vscode-restructuredtext/_apis/build/status/vscode-restructuredtext.vscode-restructuredtext?branchName=master)](https://dev.azure.com/lextudio/vscode-restructuredtext/_build/latest?definitionId=2&branchName=master)

This extension provides rich reStructuredText language support for Visual Studio Code.
Now you write reStructuredText scripts using the excellent IDE-like interface
that VS Code provides.

![reStructuredText in Visual Studio Code](images/main.gif)

## Features

- Syntax Highlighting
- Code Snippets
- Live Preview
- Section Builder
- Linter
- IntelliSense (**Experimental**)

Frequent Asked Questions can be found [here](https://github.com/vscode-restructuredtext/vscode-restructuredtext/issues?q=is%3Aissue+label%3A%22faq+candidate%22+).

## How to install from Marketplace

This extension is hosted at [Visual Studio Marketplace](https://marketplace.visualstudio.com/items/lextudio.restructuredtext)

1. Upgrade to Visual Studio Code 1.15.0 or above.
1. Switch to the Extensions view by clicking the fifth icon in the left most bar.
1. Type "restructuredtext" in the search box and hit Enter key.
1. Click "Install" button to install "reStructuredText" extension.

After installing this extension, please visit [the homepage for this extension](https://docs.restructuredtext.net) to learn how to use it.

## Contributing to the code

Check out the [development documentation](https://docs.restructuredtext.net/en/latest/articles/development.html) for more details
on how to contribute to this extension!

Check the [dashboard on work items](https://waffle.io/vscode-restructuredtext/vscode-restructuredtext).

## License

This extension is [licensed under the MIT License](LICENSE.txt).  Please see the
[third-party notices](https://docs.restructuredtext.net/en/latest/articles/thirdparties.html) file for details on the third-party
files that we include with releases of this project.

## Acknowledgements
### Logo
The project logo comes from [Legendora Icon](http://raindropmemory.deviantart.com/art/Legendora-Icon-Set-118999011) by [Teekatas Suwannakrua](http://raindropmemory.deviantart.com/).

### Linter
The linter support is based on [Cody Hoover's ruby-linter](https://marketplace.visualstudio.com/items?itemName=hoovercj.ruby-linter).

### Live Preview
The initial idea was brought from [Thomas Haakon Townsend's ReStructured Text Previewer](https://marketplace.visualstudio.com/items?itemName=tht13.rst-vscode), but soon after moving fully to Sphinx, this extension becomes its own beast.

### IntelliSense
The IntelliSense support is provided by the reStructuredText Language Server.
