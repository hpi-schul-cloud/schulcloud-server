import { Configuration } from '@hpi-schul-cloud/commons';
import { JwtAuthGuardConfig } from '@infra/auth-guard';
import { S3Config } from '@infra/s3-client';
import { Algorithm } from 'jsonwebtoken';

export interface FwuLearningContentsConfig extends JwtAuthGuardConfig {
	NEST_LOG_LEVEL: string;
	INCOMING_REQUEST_TIMEOUT: number;
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
	...jwtAuthGuardConfig,
};

export const config = () => fwuLearningContentsConfig;
