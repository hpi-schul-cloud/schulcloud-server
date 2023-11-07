import { S3Config } from '@infra/s3-client';

export interface PreviewModuleConfig {
	NEST_LOG_LEVEL: string;
	INCOMING_REQUEST_TIMEOUT: number;
}

export interface PreviewConfig {
	storageConfig: S3Config;
	serverConfig: PreviewModuleConfig;
}
