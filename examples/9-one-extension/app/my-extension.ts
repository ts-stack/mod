import { Injectable, Inject } from '@ts-stack/di';
import { edk, Logger } from '@ditsmod/core';

@Injectable()
export class MyExtension implements edk.Extension {
  #inited: boolean;

  constructor(
    @Inject(edk.APP_METADATA_MAP) private appMetadataMap: edk.AppMetadataMap,
    private extensionsManager: edk.ExtensionsManager,
    private log: Logger
  ) {}

  async init() {
    if (this.#inited) {
      return;
    }

    this.log.info(this.appMetadataMap);
    const rawRouteMeta = await this.extensionsManager.init(edk.ROUTES_EXTENSIONS);
    this.log.info(rawRouteMeta);

    this.#inited = true;
  }
}
