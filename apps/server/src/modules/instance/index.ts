/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export { InstanceEntity } from './entity';
export { Instance } from './domain';
export { InstanceService } from './service';
export { InstanceModule } from './instance.module';
