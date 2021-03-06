import { ListenOptions } from 'net';
import { InjectionToken } from '@ts-stack/di';

import { ServerOptions } from '../types/server-options';
import { HttpModule } from '../types/http-module';
import { Extension } from './mix';

export interface RootModuleMetadata {
  httpModule?: HttpModule;
  serverName?: string;
  serverOptions?: ServerOptions;
  listenOptions?: ListenOptions;
  prefixPerApp?: string;
  extensions?: InjectionToken<Extension<any>[]>[];
}
