/** **********************************************************
 * This is a module facade!                                  *
 * Please export only what is allowed to be used externally. *
 * Please do not use wildcard exports.                       *
 *********************************************************** */

export { RegistrationApiModule } from './registration-api.module';
export { REGISTRATION_PUBLIC_API_CONFIG_TOKEN, RegistrationPublicApiConfig } from './registration.config';
export { RegistrationModule } from './registration.module';
export { RegistrationEntity } from './repo/entity';
