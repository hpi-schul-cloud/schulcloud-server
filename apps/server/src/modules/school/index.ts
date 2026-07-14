/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export {
	FileStorageType,
	School,
	SchoolFactory,
	SchoolFeature,
	SchoolPermissions,
	SchoolService,
	SchoolYearService,
} from './domain';
export { SchoolYearEntityMapper } from './repo';
export { SchoolModule } from './school.module';
