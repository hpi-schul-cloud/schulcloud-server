/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export { ALERT_PUBLIC_API_CONFIG, AlertPublicApiConfig } from './alert.config';
export { AlertModule } from './alert.module';
