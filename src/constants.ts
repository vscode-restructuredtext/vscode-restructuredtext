export const PYTHON_EXTENSION = "ms-python.python"

export class Constants {
  public static readonly python = "python";
  public static readonly shrinkLength = 32;
}

export namespace Server {
  export const REQUIRED_PYTHON = "3.6.0"
  export const REQUIRED_VERSION = "0.7.0"
}

export namespace Commands {

  export const OPEN_PREVIEW = "esbonio.preview.open"
  export const OPEN_PREVIEW_TO_SIDE = "esbonio.preview.openSide"

  export const INSTALL_SERVER = "esbonio.server.install"
  export const RESTART_SERVER = "esbonio.server.restart"
  export const UPDATE_SERVER = "esbonio.server.update"

  export const RELOAD_WINDOW = "workbench.action.reloadWindow"
  export const OPEN_EXTENSION = "extension.open"
  export const INSTALL_EXTENSION = "workbench.extensions.installExtension"
  export const UNINSTALL_EXTENSION = "workbench.extensions.uninstallExtension"
}
