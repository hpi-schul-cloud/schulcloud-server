/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export { MediaGroupLicense } from './domain';
export { GroupLicenseType } from './enum';
export { MediaGroupLicenseService } from './service';
export { GroupLicenseModule } from './group-license.module';
