/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export {
	RuntimeConfigDefault,
	RuntimeConfigType,
	RuntimeConfigValue,
	RuntimeConfigValueType,
} from './domain/runtime-config-value.do';
export { RuntimeConfigService } from './domain/runtime-config.service';
