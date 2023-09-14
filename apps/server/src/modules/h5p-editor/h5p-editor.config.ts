import { Configuration } from '@hpi-schul-cloud/commons';
import { S3Config } from '@shared/infra/s3-client';

const h5pEditorConfig = {
	NEST_LOG_LEVEL: Configuration.get('NEST_LOG_LEVEL') as string,
	INCOMING_REQUEST_TIMEOUT: Configuration.get('INCOMING_REQUEST_TIMEOUT_API') as number,
};

export const translatorConfig = {
	AVAILABLE_LANGUAGES: (Configuration.get('I18N__AVAILABLE_LANGUAGES') as string).split(','),
};

export const H5P_CONTENT_S3_CONNECTION = 'H5P_CONTENT_S3_CONNECTION';
export const H5P_LIBRARIES_S3_CONNECTION = 'H5P_LIBRARIES_S3_CONNECTION';

export const s3ConfigContent: S3Config = {
	connectionName: H5P_CONTENT_S3_CONNECTION,
	endpoint: Configuration.get('H5P_EDITOR__S3_ENDPOINT') as string,
	region: Configuration.get('H5P_EDITOR__S3_REGION') as string,
	bucket: Configuration.get('H5P_EDITOR__S3_BUCKET_CONTENT') as string,
	accessKeyId: Configuration.get('H5P_EDITOR__S3_ACCESS_KEY_ID_RW') as string,
	secretAccessKey: Configuration.get('H5P_EDITOR__S3_SECRET_ACCESS_KEY_RW') as string,
};

export const s3ConfigLibraries: S3Config = {
	connectionName: H5P_LIBRARIES_S3_CONNECTION,
	endpoint: Configuration.get('H5P_EDITOR__S3_ENDPOINT') as string,
	region: Configuration.get('H5P_EDITOR__S3_REGION') as string,
	bucket: Configuration.get('H5P_EDITOR__S3_BUCKET_LIBRARIES') as string,
	accessKeyId: Configuration.get('H5P_EDITOR__S3_ACCESS_KEY_ID_R') as string,
	secretAccessKey: Configuration.get('H5P_EDITOR__S3_SECRET_ACCESS_KEY_R') as string,
};

export const config = () => h5pEditorConfig;
