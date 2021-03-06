import { NormalizedModuleMetadata } from '../models/normalized-module-metadata';
import { ControllerAndMethodMetadata } from './controller-and-method-metadata';
import { NormalizedGuard } from './mix';

export class MetadataPerMod {
  prefixPerMod: string;
  guardsPerMod: NormalizedGuard[];
  moduleMetadata: NormalizedModuleMetadata;
  /**
   * The controller metadata collected from all controllers of current module.
   */
  controllersMetadata: ControllerAndMethodMetadata[];
}
