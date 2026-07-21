/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export { TldrawClientAdapter } from './tldraw-client.adapter';
export { InternalTldrawClientConfig } from './tldraw-client.config';
export { TldrawClientModule } from './tldraw-client.module';
