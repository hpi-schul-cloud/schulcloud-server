import { Configuration } from '@hpi-schul-cloud/commons';
import { JwtAuthGuardConfig } from '@infra/auth-guard';
import { S3Config } from '@infra/s3-client';
import { ValkeyMode } from '@infra/valkey-client';
import { Algorithm } from 'jsonwebtoken';

export interface FwuLearningContentsConfig extends JwtAuthGuardConfig {
	NEST_LOG_LEVEL: string;
	INCOMING_REQUEST_TIMEOUT: number;
	SESSION_VALKEY__MODE?: ValkeyMode;
	SESSION_VALKEY__URI?: string;
	SESSION_VALKEY__SENTINEL_NAME?: string;
	SESSION_VALKEY__SENTINEL_PASSWORD?: string;
	SESSION_VALKEY__SENTINEL_SERVICE_NAME?: string;
}

export const FWU_CONTENT_S3_CONNECTION = 'FWU_CONTENT_S3_CONNECTION';

export const s3Config: S3Config = {
	connectionName: FWU_CONTENT_S3_CONNECTION,
	endpoint: Configuration.get('FWU_CONTENT__S3_ENDPOINT') as string,
	region: Configuration.get('FWU_CONTENT__S3_REGION') as string,
	bucket: Configuration.get('FWU_CONTENT__S3_BUCKET') as string,
	accessKeyId: Configuration.get('FWU_CONTENT__S3_ACCESS_KEY') as string,
	secretAccessKey: Configuration.get('FWU_CONTENT__S3_SECRET_KEY') as string,
};

const jwtAuthGuardConfig: JwtAuthGuardConfig = {
	// Node's process.env escapes newlines. We need to reverse it for the keys to work.
	// See: https://stackoverflow.com/questions/30400341/environment-variables-containing-newlines-in-node
	JWT_PUBLIC_KEY: (Configuration.get('JWT_PUBLIC_KEY') as string).replace(/\\n/g, '\n'),
	JWT_SIGNING_ALGORITHM: Configuration.get('JWT_SIGNING_ALGORITHM') as Algorithm,
	SC_DOMAIN: Configuration.get('SC_DOMAIN') as string,
};

const fwuLearningContentsConfig: FwuLearningContentsConfig = {
	NEST_LOG_LEVEL: Configuration.get('NEST_LOG_LEVEL') as string,
	INCOMING_REQUEST_TIMEOUT: Configuration.get('FWU_CONTENT__INCOMING_REQUEST_TIMEOUT_MS') as number,
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
	...jwtAuthGuardConfig,
};

export const config = (): FwuLearningContentsConfig => fwuLearningContentsConfig;
