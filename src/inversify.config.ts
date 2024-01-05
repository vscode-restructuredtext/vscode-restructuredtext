import 'reflect-metadata';

import {Container} from 'inversify';
import {NAMES, TYPES} from './types';
import {ConsoleLogger, Logger} from './util/logger';
import {Python} from './util/python';
import {Configuration} from './util/configuration';
import {workspace} from 'vscode';

const container = new Container();

const folders = workspace.workspaceFolders;
const singleFolder = folders?.length === 1;

const main = new ConsoleLogger('reStructuredText');
container
    .bind<Logger>(TYPES.Logger)
    .toConstantValue(main)
    .whenTargetNamed(NAMES.Main);
const lsp = new ConsoleLogger('Esbonio Language Server');
container
    .bind<Logger>(TYPES.Logger)
    .toConstantValue(lsp)
    .whenTargetNamed(NAMES.Lsp);
container
    .bind<Configuration>(TYPES.Configuration)
    .to(Configuration)
    .inSingletonScope();
container.bind<Python>(TYPES.Python).to(Python).inSingletonScope();
container.bind<boolean>(TYPES.SingleFolder).toConstantValue(singleFolder);

export default container;
