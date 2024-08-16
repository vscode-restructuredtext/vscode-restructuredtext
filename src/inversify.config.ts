import 'reflect-metadata';

import {Container} from 'inversify';
import {NAMES, TYPES} from './types';
import {ConsoleLogger, Logger} from './util/logger';
import {Python} from './util/python';
import {Configuration} from './util/configuration';

const container = new Container();

const main = new ConsoleLogger('reStructuredText');
container
    .bind<Logger>(TYPES.Logger)
    .toConstantValue(main)
    .whenTargetNamed(NAMES.Main);
container
    .bind<Configuration>(TYPES.Configuration)
    .to(Configuration)
    .inSingletonScope();
container.bind<Python>(TYPES.Python).to(Python).inSingletonScope();

export default container;
