import { Configuration } from '@hpi-schul-cloud/commons';
import { LoggerConfig } from '@src/core/logger';
import { JwtAuthGuardConfig } from '@infra/auth-guard';
import { CoursesClientConfig } from '@infra/courses-client';
import { Algorithm } from 'jsonwebtoken';

export interface CommonCartridgeConfig extends LoggerConfig, JwtAuthGuardConfig, CoursesClientConfig {
	INCOMING_REQUEST_TIMEOUT: number;
	FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_MAX_FILE_SIZE: number;
}

const commonCartridgeConfig: CommonCartridgeConfig = {
	NEST_LOG_LEVEL: Configuration.get('NEST_LOG_LEVEL') as string,
	EXIT_ON_ERROR: Configuration.get('EXIT_ON_ERROR') as boolean,
	INCOMING_REQUEST_TIMEOUT: Configuration.get('FILES_STORAGE__INCOMING_REQUEST_TIMEOUT') as number,
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
