import { Configuration } from '@hpi-schul-cloud/commons';
import { S3Client } from '@aws-sdk/client-s3';

export const s3Client = new S3Client({
	endpoint: Configuration.get('FWU_CONTENT__S3_ENDPOINT') as string,
	credentials: {
		accessKeyId: Configuration.get('FWU_CONTENT__S3_ACCESS_KEY') as string,
		secretAccessKey: Configuration.get('FWU_CONTENT__S3_SECRET_KEY') as string,
	},
	region: Configuration.get('FWU_CONTENT__S3_REGION') as string,
	tls: true,
	forcePathStyle: true,
});

export const s3Bucket = Configuration.get('FWU_CONTENT__S3_BUCKET') as string;

export const fwuContentEnabled = Configuration.get('FEATURE_FWU_CONTENT_ENABLED') as boolean;
