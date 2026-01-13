import { LoggerConfig } from '@core/logger';
import { Configuration } from '@hpi-schul-cloud/commons';
import { JwtAuthGuardConfig } from '@infra/auth-guard';
import { AuthorizationClientConfig } from '@infra/authorization-client';
import { CoursesClientConfig } from '@infra/courses-client';
import { ValkeyMode } from '@infra/valkey-client';
import { Algorithm } from 'jsonwebtoken';

export interface CommonCartridgeConfig extends LoggerConfig, JwtAuthGuardConfig, CoursesClientConfig {
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
	SC_DOMAIN: Configuration.get('SC_DOMAIN') as string,
	JWT_PUBLIC_KEY: (Configuration.get('JWT_PUBLIC_KEY') as string).replace(/\\n/g, '\n'),
	JWT_SIGNING_ALGORITHM: Configuration.get('JWT_SIGNING_ALGORITHM') as Algorithm,
	SESSION_VALKEY__MODE: Configuration.get('SESSION_VALKEY__MODE') as ValkeyMode,
	SESSION_VALKEY__URI: Configuration.has('SESSION_VALKEY__URI')
		? (Configuration.get('SESSION_VALKEY__URI') as string)
		: undefined,
	SESSION_VALKEY__SENTINEL_NAME: Configuration.has('SESSION_VALKEY__SENTINEL_NAME')
		? (Configuration.get('SESSION_VALKEY__SENTINEL_NAME') as string)
		: undefined,
	SESSION_VALKEY__SENTINEL_PASSWORD: Configuration.has('SESSION_VALKEY__SENTINEL_PASSWORD')
		? (Configuration.get('SESSION_VALKEY__SENTINEL_PASSWORD') as string)
		: undefined,
	SESSION_VALKEY__SENTINEL_SERVICE_NAME: Configuration.has('SESSION_VALKEY__SENTINEL_SERVICE_NAME')
		? (Configuration.get('SESSION_VALKEY__SENTINEL_SERVICE_NAME') as string)
		: undefined,
	FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_MAX_FILE_SIZE: Configuration.get(
		'FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_MAX_FILE_SIZE'
	) as number,
	API_HOST: Configuration.get('API_HOST') as string,
};

export function config(): CommonCartridgeConfig {
	return commonCartridgeConfig;
}
