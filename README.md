# reStructuredText Language Support for Visual Studio Code

[![Become a Sponsor](https://img.shields.io/badge/Become%20a%20Sponsor-lextudio-orange.svg?style=for-readme)](https://github.com/sponsors/lextudio)
[![Build Status](https://img.shields.io/github/actions/workflow/status/vscode-restructuredtext/vscode-restructuredtext/node.js.yml?branch=master)](https://github.com/vscode-restructuredtext/vscode-restructuredtext/actions)
[![Stable Version](https://img.shields.io/visual-studio-marketplace/v/lextudio.restructuredtext.svg?label=stable&color=)](https://marketplace.visualstudio.com/items?itemName=lextudio.restructuredtext)
[![Install Count](https://img.shields.io/visual-studio-marketplace/i/lextudio.restructuredtext.svg)](https://marketplace.visualstudio.com/items?itemName=lextudio.restructuredtext)
[![Download Count](https://img.shields.io/visual-studio-marketplace/d/lextudio.restructuredtext.svg)](https://marketplace.visualstudio.com/items?itemName=lextudio.restructuredtext)
[![Pre-release Version](https://img.shields.io/visual-studio-marketplace/v/lextudio.restructuredtext.svg?include_prereleases&label=pre-release)](https://marketplace.visualstudio.com/items?itemName=lextudio.restructuredtext)

This extension provides rich reStructuredText language support for Visual Studio Code.
Now you write reStructuredText scripts using the excellent IDE-like interface
that VS Code provides.

![reStructuredText in Visual Studio Code](images/main.gif)

## Features

- Code Snippets
- Editor Enhancement
- Linter
- Syntax Highlighting (via [dependent extension](https://marketplace.visualstudio.com/items?itemName=trond-snekvik.simple-rst) by Trond Snekvik)
- IntelliSense (via [dependent extension](https://marketplace.visualstudio.com/items?itemName=swyddfa.esbonio) by Alex Carney)
- Live Preview (via [dependent extension](https://marketplace.visualstudio.com/items?itemName=swyddfa.esbonio) by Alex Carney)

Frequent Asked Questions can be found [here](https://github.com/vscode-restructuredtext/vscode-restructuredtext/issues?q=is%3Aissue+label%3A%22faq+candidate%22+).

## How to install from Marketplace

This extension is hosted at [Visual Studio Marketplace](https://marketplace.visualstudio.com/items/lextudio.restructuredtext)

1. Upgrade to Visual Studio Code 1.82.0 or above.
1. Switch to the Extensions view by clicking the fifth icon in the left most bar.
1. Type "restructuredtext" in the search box and hit Enter key.
1. Click "Install" button to install "reStructuredText" extension (by LeXtudio Inc.).

After installing this extension, please visit [the homepage for this extension](https://docs.restructuredtext.net) to learn how to use it.

## Contributing to the code

Check out the [development documentation](https://docs.restructuredtext.net/articles/development.html) for more details
on how to contribute to this extension!

## License

This extension is [licensed under the MIT License](LICENSE.txt).  Please see the
[third-party notices](https://docs.restructuredtext.net/articles/thirdparties.html) file for details on the third-party
files that we include with releases of this project.

## Acknowledgements
### Logo
The project logo comes from [Legendora Icon](http://raindropmemory.deviantart.com/art/Legendora-Icon-Set-118999011) by [Teekatas Suwannakrua](http://raindropmemory.deviantart.com/).

### Linter
The linter support is based on [Cody Hoover's ruby-linter](https://marketplace.visualstudio.com/items?itemName=hoovercj.ruby-linter). Either rstcheck or doc8 can be used as default linter.
