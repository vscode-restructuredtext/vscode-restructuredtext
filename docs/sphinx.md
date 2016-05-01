#How to work with Sphinx

## Note on Preview Feature
The preview feature relies on sphinx generated HTML files. So before previewing a file, the HTML page must be generated ahead manually,
via ``make html``.

Automatic page generation is being investigated and will be added in a later release.

## Preview Settings
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

## Use VS Code Tasks
This requires a new file `./.vscode/tasks.json` to be created under your workspace root directory.

The sample content is as below,

```
{
    "version": "0.1.0",
    "command": "make",
    "isShellCommand": true,
    "args": ["html"],
    "showOutput": "silent",
        "problemMatcher": {
        "owner": "restructuredtext",
        "fileLocation": ["absolute"],
        "pattern": {
            "regexp": "^(.*):(\\d+):\\s+(WARNING|ERROR):\\s+(.*)$",
            "file": 1,
            "line": 2,
            "severity": 3,
            "message": 4
        }
    }
}
```

Once this file is saved, the following steps can activate it in VS Code,

1. Press `F1` to open the Command panel in VS Code.
1. Type "Run Task" and choose "Tasks: Run Task" command from the list.
1. Press `Enter` key to active the task list, where "make" is showed.
1. Choose "make" and press `Enter` key again.

The warning and errors can be checked in Error panel by pressing `⇧⌘M`.

Note that this assumes your document project has `make.bat` or `makefile` at root 
directory. One example project can be found [here](https://github.com/lextudio/linpeiman).

If your document project does not have such files at root directory, you can add a `makefile` 
at root directory, and redirect the command to the target directory. One example project can 
be found [here](https://github.com/lextm/sharpsnmp_docs).

## Launch a Terminal (The Easy Way)
If you do want to open a terminal, it is quite easy to launch a terminal as below,

1. Open a Sphinx project folder in VS Code.
1. Press `⇧⌘C` to launch a terminal.

At terminal Sphinx commands can be executed.

## Launch a Terminal (The Hard Way)
Alternatively, the following steps can be used,

1. Press `F1` to open the Command panel in VS Code.
1. Type "Terminal" till "Open New Terminal" command shows and highlights.
1. Press `Enter` key to launch the terminal.
