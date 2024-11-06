import { Configuration } from '@hpi-schul-cloud/commons';
import { AuthorizationClientConfig } from '@infra/authorization-client';
import { S3Config } from '@infra/s3-client';
import { CoreModuleConfig } from '@src/core';

export const FILES_STORAGE_S3_CONNECTION = 'FILES_STORAGE_S3_CONNECTION';
export interface FileStorageConfig extends CoreModuleConfig, AuthorizationClientConfig {
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

const fileStorageConfig: FileStorageConfig = {
	MAX_FILE_SIZE: Configuration.get('FILES_STORAGE__MAX_FILE_SIZE') as number,
	MAX_SECURITY_CHECK_FILE_SIZE: Configuration.get('FILES_STORAGE__MAX_FILE_SIZE') as number,
	USE_STREAM_TO_ANTIVIRUS: Configuration.get('FILES_STORAGE__USE_STREAM_TO_ANTIVIRUS') as boolean,
	...authorizationClientConfig,
	...defaultConfig,
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
