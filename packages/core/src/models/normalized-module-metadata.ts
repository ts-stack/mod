import { InjectionToken } from '@ts-stack/di';

import { AnyObj } from '../types/mix';
import { ControllerType } from '../types/mix';
import { ModuleType } from '../types/mix';
import { ModuleWithParams } from '../types/mix';
import { ServiceProvider } from '../types/mix';
import { ProvidersMetadata } from './providers-metadata';

export class NormalizedModuleMetadata<T extends AnyObj = AnyObj> extends ProvidersMetadata {
  /**
   * The module setted here must be identical to the module
   * passed to "imports" or "exports" array of `@Module` metadata.
   */
  module: ModuleType<T> | ModuleWithParams<T>;
  /**
   * The module name.
   */
  name: string;
  /**
   * The module ID.
   */
  id?: string = '';
  importsModules?: ModuleType[] = [];
  importsWithParams?: ModuleWithParams[] = [];
  controllers?: ControllerType[] = [];
  extensions?: InjectionToken<any>[] = [];
  ngMetadataName: string;
  exportsModules?: ModuleType[] = [];
  exportsProviders?: ServiceProvider[] = [];
}
