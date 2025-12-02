import { LoggerConfig } from '@core/logger';
import { Configuration } from '@hpi-schul-cloud/commons';
import { JwtAuthGuardConfig } from '@infra/auth-guard';
import { AuthorizationClientConfig } from '@infra/authorization-client';
import { CoursesClientConfig } from '@infra/courses-client';
import { Algorithm } from 'jsonwebtoken';

export interface CommonCartridgeConfig extends LoggerConfig, JwtAuthGuardConfig, CoursesClientConfig {
	FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_MAX_FILE_SIZE: number;
}

export const authorizationClientConfig: AuthorizationClientConfig = {
	basePath: `${Configuration.get('API_HOST') as string}/v3/`,
};

const commonCartridgeConfig: CommonCartridgeConfig = {
	NEST_LOG_LEVEL: Configuration.get('NEST_LOG_LEVEL') as string,
	EXIT_ON_ERROR: Configuration.get('EXIT_ON_ERROR') as boolean,
	SC_DOMAIN: Configuration.get('SC_DOMAIN') as string,
	JWT_PUBLIC_KEY: (Configuration.get('JWT_PUBLIC_KEY') as string).replace(/\\n/g, '\n'),
	JWT_SIGNING_ALGORITHM: Configuration.get('JWT_SIGNING_ALGORITHM') as Algorithm,
	FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_MAX_FILE_SIZE: Configuration.get(
		'FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_MAX_FILE_SIZE'
	) as number,
	API_HOST: Configuration.get('API_HOST') as string,
};

export function config(): CommonCartridgeConfig {
	return commonCartridgeConfig;
}
