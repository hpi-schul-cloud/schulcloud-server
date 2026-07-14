/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export { Consent, ParentConsent, UserConsent, UserDo, UserService } from './domain';
export { USER_PUBLIC_API_CONFIG_TOKEN, UserPublicApiConfig } from './user.config';
export { UserModule } from './user.module';
export { User } from './repo';
