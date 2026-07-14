/** **********************************************************
 * This is a module facade!                                  *
 * Please export only what is allowed to be used externally. *
 * Please do not use wildcard exports.                       *
 *********************************************************** */

export { Consent, ParentConsent, UserConsent, UserDo, UserService } from './domain';
export { USER_PUBLIC_API_CONFIG_TOKEN, UserPublicApiConfig } from './user.config';
export { UserModule } from './user.module';
export { User } from './repo';
