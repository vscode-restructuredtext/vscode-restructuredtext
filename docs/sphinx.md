#How to work with Sphinx

## Note on Live Preview Feature
The preview feature relies on sphinx generated HTML files.

About how to install Python and sphinx, please refer to [this article](https://github.com/aspnet/Docs/blob/master/CONTRIBUTING.md).

## Live Preview Settings
For this extension to locate the generated HTML pages, two settings can be set.

This requires a new file `./.vscode/settings.json` to be created under your workspace root directory.

The sample content is as below,
```
{
    "restructuredtext.confPath" : "conf.py",
    "restructuredtext.builtDocumentationPath" : "_build/html"
}
```
which shows the default values. A file with customized values might look as below,
```
{
    "restructuredtext.confPath" : "manager/conf.py",
    "restructuredtext.builtDocumentationPath" : "manager/_build/html"
}
```
