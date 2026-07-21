/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export { RegistrationApiModule } from './registration-api.module';
export { REGISTRATION_PUBLIC_API_CONFIG_TOKEN, RegistrationPublicApiConfig } from './registration.config';
export { RegistrationModule } from './registration.module';
export { RegistrationEntity } from './repo/entity';
