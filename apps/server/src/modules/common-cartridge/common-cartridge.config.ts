import { LoggerConfig } from '@core/logger';
import { Configuration } from '@hpi-schul-cloud/commons';

export interface CommonCartridgeConfig extends LoggerConfig {
	INCOMING_REQUEST_TIMEOUT: number;
	FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_MAX_FILE_SIZE: number;
}

const commonCartridgeConfig: CommonCartridgeConfig = {
	NEST_LOG_LEVEL: Configuration.get('NEST_LOG_LEVEL') as string,
	EXIT_ON_ERROR: Configuration.get('EXIT_ON_ERROR') as boolean,
	INCOMING_REQUEST_TIMEOUT: Configuration.get('COMMON_CARTRIDGE__INCOMING_REQUEST_TIMEOUT_MS') as number,
	FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_MAX_FILE_SIZE: Configuration.get(
		'FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_MAX_FILE_SIZE'
	) as number,
};

export function config(): CommonCartridgeConfig {
	return commonCartridgeConfig;
}
