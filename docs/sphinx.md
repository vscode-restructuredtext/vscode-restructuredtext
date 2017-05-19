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

You can preview .rst files if `makefile` (or `make.bat`) is at the root folder, and the default HTML output folder is `_build/html`.

# Live Preview Settings
You might need to set three settings so as to let this extension locate the generated HTML pages in some cases.

First, a new file `.vscode/settings.json` needs to be created under the root directory shown in your Explorer tab in Visual Studio Code.

Its default content is as below,
```
{
    "restructuredtext.builtDocumentationPath" : "_build/html",
    "restructuredtext.makefilePath"           : ".",
    "restructuredtext.updateOnTextChanged"    : "true",
    "restructuredtext.sphinxBuildPath"        : null
}
```
Note that all settings are set to the default values. 

A file with customized values might look as below,
```
{
    "restructuredtext.builtDocumentationPath" : "manager/_build/html",
    "restructuredtext.makefilePath"           : "manager",
    "restructuredtext.updateOnTextChanged"    : "false",
    "restructuredtext.sphinxBuildPath"        : "C:\\Users\\lextm\\AppData\\Local\\Programs\\Python\\Python36\\Scripts\\sphinx-build.exe"
}
```

## Makefile Path
This extension relies on sphinx generated makefile to perform compilation. 

Usually when a sphinx project is opened, makefile is located at the root in Explorer folder, and that's the default value ```.``` of `restructuredtext.makefilePath`.

If you move makefile to another location, then please set `restructuredtext.makefilePath` to the proper path, such as ```manager```.

## Built Documentation Path
The value for `restructuredtext.builtDocumentationPath` above can be queried from makefile.

If the Makefile contains the following,
```
# Makefile for Sphinx documentation
#

# You can set these variables from the command line.
SPHINXOPTS    =
SPHINXBUILD   = sphinx-build
PAPER         =
BUILDDIR      = build
```

Then the value should be set to ```build/html```.

## Sphinx Build Path
The value for `restructuredtext.sphinxBuildPath` above depends on your Python installation.

On Windows Python can be installed to all possible locations and does not appear in PATH environment variable. Then you must set this value to the proper sphinx-build.exe file path.

# Troubleshooting Guide
If any error happens, please follow the steps below to locate the possible causes.

## Locate The Makefile Folder
1. Open Integrated Terminal in Visual Studio Code code by clicking "View | Integrated Terminal".
1. If you have `.vscode/settings.json` in the workspace, find the value of `restructuredtext.makefilePath` setting. 
Assume its value is `src`, execute `cd src` at terminal to switch to the folder.

## Test The Make Process
Execute `make html` at terminal and see its output. 

If the error indicates `make is not recognized` (or similar), then
* You forgot to generate a makefile, 
* You forgot to set `restructuredtext.makefilePath`,
* Or your `restructuredtext.makefilePath` value is wrong.

If there are Sphinx errors, refer to Sphinx documentation.

## Test The Generated HTML files
When the make process succeeds, the generated HTML pages should present in `_build/html`.

If you cannot find this folder or the extension indicates it cannot find certain HTML page, then the make process might 
generate them at another location. You have to set `restructuredtext.builtDocumentationPath`.


# Extra Notes
If your Python environment is special, and `sphinx-build` cannot be run directly, you might set `SPHINXBUILD` environment to the equivalent command.
