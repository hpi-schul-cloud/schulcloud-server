/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export { MediaSchoolLicense } from './domain';
export { SchoolLicenseType } from './enum';
export { MediaSchoolLicenseService } from './service/media-school-license.service';
export { SchoolLicenseModule } from './school-license.module';
