# What is Sphinx
Sphinx is a tool to generate HTML/PDF from reStructuredText documents.

This extension relies on specific sphinx setup documented below to show live preview.

# Install Sphinx (0.0.14 and above)
1. [Download python](https://www.python.org/downloads/) version 2.7.10 or higher (Version 3.4 is recommended).

2. If you are installing on Windows, ensure both the Python install directory and the Python scripts directory have been added to your `PATH` environment variable. For example, if you install Python into the `c:\python34` directory, you would add `c:\python34;c:\python34\scripts` to your `PATH` environment variable.

3. Install Sphinx by opening a command prompt and running the following Python command. (Note that this operation might take a few minutes to complete.)

    ```pip install sphinx sphinx-autobuild```

Note that latest steps on how to install Python and sphinx, please refer to [this article](https://docs.readthedocs.io/en/latest/getting_started.html#in-rst).

# Sample Project
Generate a sample project to test out this extension. The test project has the following contents, like makefile, conf.py, and build folder. 
Then you can better understand why the below settings are required.

```
mkdir sphinxtest
cd sphinxtest
sphinx-quickstart
code .
```
Now this project is opened in Visual Studio Code.

You can preview .rst files as `conf.py` is at the root folder, and the default HTML output folder is `_build/html`.

# Live Preview Settings
You might need to set three settings so as to let this extension locate the generated HTML pages in some cases.

First, a new file `.vscode/settings.json` needs to be created under the root directory shown in your Explorer tab in Visual Studio Code.

Its default content is as below,
```
{
    "restructuredtext.builtDocumentationPath" : "_build/html",
    "restructuredtext.confPath"               : ".",
    "restructuredtext.updateOnTextChanged"    : "true",
    "restructuredtext.sphinxBuildPath"        : null
}
```
Note that all settings are set to the default values. 

A file with customized values might look as below,
```
{
    "restructuredtext.builtDocumentationPath" : "build/html",
    "restructuredtext.confPath"               : "source",
    "restructuredtext.updateOnTextChanged"    : "false",
    "restructuredtext.sphinxBuildPath"        : "C:\\Users\\lextm\\AppData\\Local\\Programs\\Python\\Python36\\Scripts\\sphinx-build.exe"
}
```

## Conf.py Path
This extension relies on sphinx `conf.py` to perform compilation. 

Usually when a sphinx project is opened, `conf.py` is located at the root in Explorer folder, and that's the default value ```.``` of `restructuredtext.confPath`.

If you have `conf.py` at another location, then please set `restructuredtext.confPath` to the proper path, such as ```source```.

## Sphinx Build Path (25.0 and above)
The value for `restructuredtext.sphinxBuildPath` above depends on your Python installation.

On Windows Python can be installed to all possible locations and does not appear in PATH environment variable. Then you must set this value to the proper sphinx-build.exe file path.

> If you intend to use Python VirtualEnv setup, please set `python.pythonPath` accordingly, and this extension will then pick up that setting instead of `sphinxBuildPath`.

# Troubleshooting Guide
If any error happens, please follow the steps below to locate the possible causes.

## Locate The Conf.py Folder
1. Open Integrated Terminal in Visual Studio Code code by clicking "View | Integrated Terminal".
1. If you have `.vscode/settings.json` in the workspace, find the value of `restructuredtext.confPath` setting. 
Assume its value is `src`, execute `cd src` at terminal to switch to the folder.

## Test The Generated HTML files
When the make process succeeds, the generated HTML pages should present in `_build/html`.

If you cannot find this folder or the extension indicates it cannot find certain HTML page, then the make process might 
generate them at another location. You have to set `restructuredtext.builtDocumentationPath`.
