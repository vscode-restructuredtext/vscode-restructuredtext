#How to work with Sphinx

## Steps to Turn On Live Preview Feature (0.0.14 and above)
The preview feature relies on sphinx generated HTML files.

1. [Download python](https://www.python.org/downloads/) version 2.7.10 or higher (Version 3.4 is recommended).

2. If you are installing on Windows, ensure both the Python install directory and the Python scripts directory have been added to your `PATH` environment variable. For example, if you install Python into the c:\python34 directory, you would add `c:\python34;c:\python34\scripts` to your `PATH` environment variable.

3. Install Sphinx by opening a command prompt and running the following Python command. (Note that this operation might take a few minutes to complete.)

    ```pip install sphinx```

4. By default, when you install Sphinx, it will install the ReadTheDocs custom theme automatically. If you need to update the installed version of this theme, you should run:

    ```pip install -U sphinx_rtd_theme```

5. Install the Sphinx .NET domain:

    ```pip install sphinxcontrib-dotnetdomain```

Note that latest steps on how to install Python and sphinx, please refer to [this article](https://github.com/aspnet/Docs/blob/master/CONTRIBUTING.md).

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
