import { Type, Provider, makeDecorator, TypeProvider } from '@ts-stack/di';

import { RouteConfig, ImportsWithPrefix, ImportsWithPrefixDecorator } from '../types/router';
import { BodyParser } from '../services/body-parser';
import { Request } from '../request';
import { Response } from '../response';
import { deepFreeze } from '../utils/deep-freeze';

export const defaultProvidersPerReq: Readonly<Provider[]> = deepFreeze([Request, Response, BodyParser]);

export interface ModuleDecoratorFactory {
  (data?: ModuleDecorator): any;
  new (data?: ModuleDecorator): ModuleDecorator;
}

export const Module = makeDecorator('Module', (data: any) => data) as ModuleDecoratorFactory;

/**
 * @todo It should be clarified that providers can go array by array.
 */
export class ProvidersMetadata {
  /**
   * Providers per the application.
   */
  providersPerApp: Provider[] = [];
  /**
   * Providers per a module.
   */
  providersPerMod: Provider[] = [];
  /**
   * Providers per a request.
   */
  providersPerReq: Provider[] = [];
}

export interface ModuleWithOptions<T> extends Partial<ProvidersMetadata> {
  module: Type<T>;
}

export abstract class StaticModuleMetadata extends ProvidersMetadata {
  /**
   * The application controllers.
   */
  controllers: TypeProvider[] = [];
  /**
   * Route config array for a current module.
   */
  routes: RouteConfig[] = [];
}

export interface ModuleDecorator extends Partial<StaticModuleMetadata> {
  /**
   * List of modules or `ModuleWithProviders` imported by this module.
   * Also you can imports modules and set some prefix per each the module.
   */
  imports?: Array<Type<any> | ModuleWithOptions<any> | ImportsWithPrefixDecorator | any[]>;
  /**
   * List of modules, `ModuleWithProviders` or providers exported by this
   * module.
   */
  exports?: Array<Type<any> | ModuleWithOptions<any> | Provider | any[]>;
}

export class ModuleMetadata extends StaticModuleMetadata {
  /**
   * Imports modules and setting some prefix per each the module.
   */
  imports: ImportsWithPrefix[] = [];
  exports: Array<Type<any> | ModuleWithOptions<any> | Provider> = [];
}

export type ModuleType = new (...args: any[]) => any;
