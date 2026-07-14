/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export { ServerTestModule } from './server.app.module';
export { SERVER_PUBLIC_API_CONFIG_TOKEN, ServerPublicApiConfig } from './server.config';
