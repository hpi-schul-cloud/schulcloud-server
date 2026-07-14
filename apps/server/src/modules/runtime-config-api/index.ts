/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export { RuntimeConfigApiModule } from './runtime-config-api.module';
export { ServerRuntimeConfigModule } from './server-runtime-config.module';
