import { Configuration } from '@hpi-schul-cloud/commons';

export const s3Config: S3Config = {
	endpoint: Configuration.get('FWU_CONTENT__S3_ENDPOINT') as string,
	region: Configuration.get('FWU_CONTENT__S3_REGION') as string,
	bucket: Configuration.get('FWU_CONTENT__S3_BUCKET') as string,
	accessKeyId: Configuration.get('FWU_CONTENT__S3_ACCESS_KEY') as string,
	secretAccessKey: Configuration.get('FWU_CONTENT__S3_SECRET_KEY') as string,
};

//export const s3Bucket = Configuration.get('FWU_CONTENT__S3_BUCKET') as string;

//export const fwuContentEnabled = Configuration.get('FEATURE_FWU_CONTENT_ENABLED') as boolean;
