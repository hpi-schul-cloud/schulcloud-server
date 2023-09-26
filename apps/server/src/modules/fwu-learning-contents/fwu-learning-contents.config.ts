import { Configuration } from '@hpi-schul-cloud/commons';
import { S3Config } from '@shared/infra/s3-client';

export const FWU_CONTENT_S3_CONNECTION = 'FWU_CONTENT_S3_CONNECTION';

export const s3Config: S3Config = {
	connectionName: FWU_CONTENT_S3_CONNECTION,
	endpoint: Configuration.get('FWU_CONTENT__S3_ENDPOINT') as string,
	region: Configuration.get('FWU_CONTENT__S3_REGION') as string,
	bucket: Configuration.get('FWU_CONTENT__S3_BUCKET') as string,
	accessKeyId: Configuration.get('FWU_CONTENT__S3_ACCESS_KEY') as string,
	secretAccessKey: Configuration.get('FWU_CONTENT__S3_SECRET_KEY') as string,
};

const fwuLearningContentsConfig = {
	NEST_LOG_LEVEL: Configuration.get('NEST_LOG_LEVEL') as string,
	INCOMING_REQUEST_TIMEOUT: Configuration.get('FWU_CONTENT__INCOMING_REQUEST_TIMEOUT_MS') as number,
};

export const config = () => fwuLearningContentsConfig;
