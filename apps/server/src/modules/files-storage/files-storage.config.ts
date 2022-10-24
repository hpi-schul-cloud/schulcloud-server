import { Configuration } from '@hpi-schul-cloud/commons';
import { ICoreModuleConfig } from '@src/core';
import { AvailableLogLevel } from '@src/core/logger';
import { S3Config } from './interface';

export interface IFileStorageConfig extends ICoreModuleConfig {}

const fileStorageConfig: IFileStorageConfig = {
	INCOMING_REQUEST_TIMEOUT: Configuration.get('FILES_STORAGE__INCOMING_REQUEST_TIMEOUT') as number,
	INCOMING_REQUEST_TIMEOUT_COPY_API: Configuration.get('INCOMING_REQUEST_TIMEOUT_COPY_API') as number,
	AVAILABLE_LOG_LEVELS: (Configuration.get('NEST_AVAILABLE_LOG_LEVELS') as string).split(',') as AvailableLogLevel[],
};

// The configurations lookup
// config/development.json for development
// config/test.json for tests
export const s3Config: S3Config = {
	endpoint: Configuration.get('FILES_STORAGE__S3_ENDPOINT') as string,
	region: Configuration.get('FILES_STORAGE__S3_REGION') as string,
	bucket: Configuration.get('FILES_STORAGE__S3_BUCKET') as string,
	accessKeyId: Configuration.get('FILES_STORAGE__S3_ACCESS_KEY_ID') as string,
	secretAccessKey: Configuration.get('FILES_STORAGE__S3_SECRET_ACCESS_KEY') as string,
};

export const config = () => fileStorageConfig;
