import { Configuration } from '@hpi-schul-cloud/commons';
import { JwtAuthGuardConfig } from '@infra/auth-guard';
import { AuthorizationClientConfig } from '@infra/authorization-client';
import { S3Config } from '@infra/s3-client';
import { CoreModuleConfig } from '@src/core';
import { Algorithm } from 'jsonwebtoken';

export const FILES_STORAGE_S3_CONNECTION = 'FILES_STORAGE_S3_CONNECTION';
export interface FileStorageConfig extends CoreModuleConfig, AuthorizationClientConfig, JwtAuthGuardConfig {
	MAX_FILE_SIZE: number;
	MAX_SECURITY_CHECK_FILE_SIZE: number;
	USE_STREAM_TO_ANTIVIRUS: boolean;
}

export const defaultConfig = {
	NEST_LOG_LEVEL: Configuration.get('NEST_LOG_LEVEL') as string,
	INCOMING_REQUEST_TIMEOUT: Configuration.get('FILES_STORAGE__INCOMING_REQUEST_TIMEOUT') as number,
};

export const authorizationClientConfig: AuthorizationClientConfig = {
	basePath: `${Configuration.get('API_HOST') as string}/v3/`,
};

const jwtAuthGuardConfig: JwtAuthGuardConfig = {
	// Node's process.env escapes newlines. We need to reverse it for the keys to work.
	// See: https://stackoverflow.com/questions/30400341/environment-variables-containing-newlines-in-node
	JWT_PUBLIC_KEY: (Configuration.get('JWT_PUBLIC_KEY') as string).replace(/\\n/g, '\n'),
	JWT_SIGNING_ALGORITHM: Configuration.get('JWT_SIGNING_ALGORITHM') as Algorithm,
	SC_DOMAIN: Configuration.get('SC_DOMAIN') as string,
};

const fileStorageConfig: FileStorageConfig = {
	MAX_FILE_SIZE: Configuration.get('FILES_STORAGE__MAX_FILE_SIZE') as number,
	MAX_SECURITY_CHECK_FILE_SIZE: Configuration.get('FILES_STORAGE__MAX_FILE_SIZE') as number,
	USE_STREAM_TO_ANTIVIRUS: Configuration.get('FILES_STORAGE__USE_STREAM_TO_ANTIVIRUS') as boolean,
	...authorizationClientConfig,
	...defaultConfig,
	...jwtAuthGuardConfig,
	EXIT_ON_ERROR: Configuration.get('EXIT_ON_ERROR') as boolean,
};

// The configurations lookup
// config/development.json for development
// config/test.json for tests
export const s3Config: S3Config = {
	connectionName: FILES_STORAGE_S3_CONNECTION,
	endpoint: Configuration.get('FILES_STORAGE__S3_ENDPOINT') as string,
	region: Configuration.get('FILES_STORAGE__S3_REGION') as string,
	bucket: Configuration.get('FILES_STORAGE__S3_BUCKET') as string,
	accessKeyId: Configuration.get('FILES_STORAGE__S3_ACCESS_KEY_ID') as string,
	secretAccessKey: Configuration.get('FILES_STORAGE__S3_SECRET_ACCESS_KEY') as string,
};

export const config = () => fileStorageConfig;
