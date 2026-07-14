/** **********************************************************
 * This is a module facade!                                  *
 * Please export only what is allowed to be used externally. *
 * Please do not use wildcard exports.                       *
 *********************************************************** */

export {
	AnyProvisioningOptions,
	SchoolSystemOptions,
	SchoolSystemOptionsProps,
	SchulConneXProvisioningOptions,
} from './domain';
export { LegacySchoolModule } from './legacy-school.module';
export * from './service';
