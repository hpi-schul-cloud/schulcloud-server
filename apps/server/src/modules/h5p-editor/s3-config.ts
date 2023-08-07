import { Configuration } from '@hpi-schul-cloud/commons';
import { S3Config } from '../files-storage/interface';

export const s3ConfigLibraries: S3Config = {
	endpoint: Configuration.get('H5P_EDITOR__S3_ENDPOINT') as string,
	region: Configuration.get('H5P_EDITOR__S3_REGION') as string,
	bucket: Configuration.get('H5P_EDITOR__S3_BUCKET_LIBRARIES') as string,
	accessKeyId: Configuration.get('H5P_EDITOR__S3_ACCESS_KEY_ID') as string,
	secretAccessKey: Configuration.get('H5P_EDITOR__S3_SECRET_ACCESS_KEY') as string,
};
