/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export * from './response';
export { SCHULCONNEX_CLIENT_CONFIG_TOKEN, SchulconnexClientConfig } from './schulconnex-client.config';
export { SchulconnexRestClient } from './schulconnex-rest-client';
