/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export { AccessTokenModule } from './access-token.module';
export { AccessTokenService, CustomPayload, accessTokenRegex, NanoidString24Chars } from './domain';
