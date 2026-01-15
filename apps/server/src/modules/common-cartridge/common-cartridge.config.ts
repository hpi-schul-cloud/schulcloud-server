import { LoggerConfig } from '@core/logger';
import { Configuration } from '@hpi-schul-cloud/commons';
import { AuthorizationClientConfig } from '@infra/authorization-client';
import { CoursesClientConfig } from '@infra/courses-client';

export interface CommonCartridgeConfig extends LoggerConfig, CoursesClientConfig {
	INCOMING_REQUEST_TIMEOUT: number;
	FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_MAX_FILE_SIZE: number;
}

export const authorizationClientConfig: AuthorizationClientConfig = {
	basePath: `${Configuration.get('API_HOST') as string}/v3/`,
};

const commonCartridgeConfig: CommonCartridgeConfig = {
	NEST_LOG_LEVEL: Configuration.get('NEST_LOG_LEVEL') as string,
	EXIT_ON_ERROR: Configuration.get('EXIT_ON_ERROR') as boolean,
	INCOMING_REQUEST_TIMEOUT: Configuration.get('COMMON_CARTRIDGE__INCOMING_REQUEST_TIMEOUT_MS') as number,
	FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_MAX_FILE_SIZE: Configuration.get(
		'FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_MAX_FILE_SIZE'
	) as number,
	API_HOST: Configuration.get('API_HOST') as string,
};

export function config(): CommonCartridgeConfig {
	return commonCartridgeConfig;
}
