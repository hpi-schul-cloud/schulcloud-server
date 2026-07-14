/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export { InternalEtherpadClientConfig } from './etherpad-client-config.interface';
export { EtherpadClientAdapter } from './etherpad-client.adapter';
export { EtherpadClientModule } from './etherpad-client.module';
