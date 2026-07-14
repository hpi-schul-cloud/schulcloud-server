/** **********************************************************
 * This is a module facade!                                  *
 * Please export only what is allowed to be used externally. *
 * Please do not use wildcard exports.                       *
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
