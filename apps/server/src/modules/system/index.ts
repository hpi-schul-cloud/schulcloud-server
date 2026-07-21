/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export { LdapConfig, OauthConfig, System, SystemDeletedEvent, SystemService, SystemType } from './domain';
export { SystemModule } from './system.module';
