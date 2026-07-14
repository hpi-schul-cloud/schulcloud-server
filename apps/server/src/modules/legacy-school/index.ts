/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export {
	AnyProvisioningOptions,
	SchoolSystemOptions,
	SchoolSystemOptionsProps,
	SchulConneXProvisioningOptions,
} from './domain';
export { LegacySchoolModule } from './legacy-school.module';
export { LegacySchoolService, SchoolSystemOptionsService } from './service';
