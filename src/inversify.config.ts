import 'reflect-metadata';

import {Container} from 'inversify';
import {NAMES, TYPES} from './types';
import {ConsoleLogger, Logger} from './util/logger';
import {Python} from './util/python';
import {Configuration} from './util/configuration';
import SelectedConfigFileStatus from './preview/statusBar';
import {ConfigFileSelector} from './preview/selector';
import {RSTEngine} from './preview/rstEngine';
import {RSTPreviewManager} from './preview/previewManager';
import {RSTContentProvider} from './preview/previewContentProvider';
import {
  ExtensionContentSecurityPolicyArbiter,
  PreviewSecuritySelector,
} from './util/security';

const container = new Container();

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
container
  .bind<SelectedConfigFileStatus>(TYPES.TransformStatus)
  .to(SelectedConfigFileStatus)
  .inSingletonScope();
container
  .bind<ConfigFileSelector>(TYPES.TransformSelector)
  .to(ConfigFileSelector)
  .inSingletonScope();
container.bind<RSTEngine>(TYPES.RstEngine).to(RSTEngine).inSingletonScope();
container
  .bind<ExtensionContentSecurityPolicyArbiter>(TYPES.Policy)
  .to(ExtensionContentSecurityPolicyArbiter)
  .inSingletonScope();
container
  .bind<RSTContentProvider>(TYPES.ContentProvider)
  .to(RSTContentProvider)
  .inSingletonScope();
container
  .bind<RSTPreviewManager>(TYPES.PreviewManager)
  .to(RSTPreviewManager)
  .inSingletonScope();
container
  .bind<PreviewSecuritySelector>(TYPES.SecuritySelector)
  .to(PreviewSecuritySelector)
  .inSingletonScope();

export default container;
