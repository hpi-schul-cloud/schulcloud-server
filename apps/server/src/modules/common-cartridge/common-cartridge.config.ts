import { Configuration } from '@hpi-schul-cloud/commons';
import { AuthorizationClientConfig } from '@infra/authorization-client';
import { CoursesClientConfig } from '@infra/courses-client';

export interface CommonCartridgeConfig extends CoursesClientConfig {
	INCOMING_REQUEST_TIMEOUT: number;
	FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_MAX_FILE_SIZE: number;
}

export const authorizationClientConfig: AuthorizationClientConfig = {
	basePath: `${Configuration.get('API_HOST') as string}/v3/`,
};

const commonCartridgeConfig: CommonCartridgeConfig = {
	INCOMING_REQUEST_TIMEOUT: Configuration.get('COMMON_CARTRIDGE__INCOMING_REQUEST_TIMEOUT_MS') as number,
	FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_MAX_FILE_SIZE: Configuration.get(
		'FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_MAX_FILE_SIZE'
	) as number,
	API_HOST: Configuration.get('API_HOST') as string,
};

export function config(): CommonCartridgeConfig {
	return commonCartridgeConfig;
}
