export const PYTHON_EXTENSION = 'ms-python.python';

export class Constants {
    public static readonly python = 'python';
    public static readonly shrinkLength = 32;
}

export const Server = {
    REQUIRED_PYTHON: '3.6.0',
    REQUIRED_VERSION: '0.7.0',
};

export const Commands = {
    OPEN_PREVIEW: 'esbonio.preview.open',
    OPEN_PREVIEW_TO_SIDE: 'esbonio.preview.openSide',

    INSTALL_SERVER: 'esbonio.server.install',
    RESTART_SERVER: 'esbonio.server.restart',
    UPDATE_SERVER: 'esbonio.server.update',

    RELOAD_WINDOW: 'workbench.action.reloadWindow',
    OPEN_EXTENSION: 'extension.open',
    INSTALL_EXTENSION: 'workbench.extensions.installExtension',
    UNINSTALL_EXTENSION: 'workbench.extensions.uninstallExtension',
};
