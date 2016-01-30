#How to work with Sphinx

It has been planned to add Sphinx integration, but it won't come soon. Before that, a few workarounds can be used.

## Use VS Code Tasks
This requires a new file `./.vscode/tasks.json` to be created in your document project.

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

Note that this assumes your document project has `make.bat` or `makefile` at root directory.

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
