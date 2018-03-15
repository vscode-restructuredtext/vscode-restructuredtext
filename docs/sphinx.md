# Live Preview and Linter

The Live Preview shortcuts are

  - `ctrl+shift+r` (on Mac `cmd+shift+r`)      Preview
  - `ctrl+k r` (on Mac `cmd+k r`)              Preview to Side

Linting is automatically enabled if the linter `doc8` is installed. The
linter scans the opened files and highlights those lines with issues
detected. The PROBLEMS tab should also show all issues detected for easy
navigation.

> A warning is displayed if `doc8` cannot be found.

Both features require Python and a few modules to be installed properly.

## Install Python, Sphinx, and Others
1. [Download python](https://www.python.org/downloads/) version 3.4 or above
(2.x might work, but no guarantee).

2. If you are installing on Windows, ensure both the Python install directory
and the Python scripts directory have been added to your `PATH` environment
variable. For example, if you install Python into the `c:\python34` directory,
you would add `c:\python34;c:\python34\scripts` to your `PATH` environment
variable.

3. Install Sphinx by opening a command prompt and running the following Python
command. (Note that this operation might take a few minutes to complete.)

    ```pip install sphinx sphinx-autobuild```

4. Install `doc8` to enable linter support.

    ```pip install doc8```

> Note that latest steps on how to install Python and sphinx, please refer to
[this article](https://docs.readthedocs.io/en/latest/getting_started.html#in-rst).

## Sample Project
Generate a sample project to test out this extension. The test project has the
following contents, like `makefile`, `conf.py`, and build folder. Then you can
better understand why the below settings are required.

```
mkdir sphinxtest
cd sphinxtest
sphinx-quickstart
code .
```
Now this project is opened in Visual Studio Code.

You can preview `.rst` files as `conf.py` is at the root folder, and the
default HTML output folder is `_build/html`.

## Linter Settings
The linter support wraps `doc8`.

### Executable Path
It expects `doc8` Python module to be installed and already added to the path.
If it is installed but cannot be found, add the path to your preferences as
seen below,
```
{
    "restructuredtext.linter.executablePath": "PathToExecutable"
}
```
> Note that this should be an absolute path.
> If you don't set this setting, but `python.pythonPath`, then this extension
> will then pick up that setting instead. Also `python.pythonPath` should be 
> an absolute path.

### Lint onType or onSave or not at all
By default the linter will lint on the fly but can be changed to linting as
you save. Note that linting on save is most useful when auto-save is on. Use
the setting below if to change the behavior with the values onType, onSave,
and off,
```
{
    "restructuredtext.linter.run": "onType"
}
```

## Live Preview Settings
You might need to set three settings so as to let this extension locate the
generated HTML pages in some cases.

First, a new file `.vscode/settings.json` needs to be created under the root
directory shown in your Explorer tab in Visual Studio Code.

Its default content is as below,
```
{
    "restructuredtext.builtDocumentationPath" : "${workspaceRoot}/_build/html",
    "restructuredtext.confPath"               : "${workspaceRoot}",
    "restructuredtext.updateOnTextChanged"    : "true",
    "restructuredtext.updateDelay"            : 300,
    "restructuredtext.sphinxBuildPath"        : null
}
```
Note that all settings are set to the default values. 

A file with customized values might look as below,
```
{
    "restructuredtext.builtDocumentationPath" : "${workspaceRoot}/build/html",
    "restructuredtext.confPath"               : "${workspaceRoot}/source",
    "restructuredtext.updateOnTextChanged"    : "false",
    "restructuredtext.updateDelay"            : 1000,
    "restructuredtext.sphinxBuildPath"        : "C:\\Users\\lextm\\AppData\\Local\\Programs\\Python\\Python36\\Scripts\\sphinx-build.exe"
}
```

### Conf.py Path
This extension relies on sphinx `conf.py` to perform compilation. 

Usually when a sphinx project is opened, `conf.py` is located at the root in
Explorer folder, and that's the default value ```${workspaceRoot}``` of
`restructuredtext.confPath`.

If you have `conf.py` at another location, then please set
`restructuredtext.confPath` to the proper path, such as
```${workspaceRoot}/source```.

> Note that this should be an absolute path.

### Sphinx Build Path (25.0 and above)
The value for `restructuredtext.sphinxBuildPath` above depends on your Python
installation.

On Windows Python can be installed to all possible locations and does not
appear in PATH environment variable. Then you must set this value to the
proper sphinx-build.exe file path.

> Note that this should be an absolute path.
> If you don't set this setting, but `python.pythonPath`, then this extension
> will then pick up that setting instead. Also `python.pythonPath` should be
> an absolute path.

# Troubleshooting Guide
If any error happens, please follow the steps below to locate the possible
causes.

## Find The Logs
1. Use "View -> Output" menu item to open Visual Studio Code OUTPUT panel.
1. On the dropdown list in the upper right area of the OUTPUT panel that says
"Search" by default, choose "reStructuredText" from the list to switch to
reStructuredText logging page.

The logs show what compiler command line is used by this extension and which
HTML is being previewed. They should indicate what might be wrong.

## Locate The Conf.py Folder
1. Open Integrated Terminal in Visual Studio Code code by clicking "View |
Integrated Terminal".
1. If you have `.vscode/settings.json` in the workspace, find the value of
`restructuredtext.confPath` setting. Assume its value is `src`, execute 
`cd src` at terminal to switch to the folder.

## Test The Generated HTML files
When the make process succeeds, the generated HTML pages should present in
`${workspaceRoot}/_build/html`.

If you cannot find this folder or the extension indicates it cannot find
certain HTML page, then the make process might generate them at another
location. You have to set `restructuredtext.builtDocumentationPath`.

> Note that this should be an absolute path.
