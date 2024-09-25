import { Configuration } from '@hpi-schul-cloud/commons';
import { AuthorizationClientConfig } from '@infra/authorization-client';
import { S3Config } from '@infra/s3-client';
import { LanguageType } from '@shared/domain/interface';
import { CoreModuleConfig } from '@src/core';

export interface H5PEditorConfig extends CoreModuleConfig, AuthorizationClientConfig {
	NEST_LOG_LEVEL: string;
	INCOMING_REQUEST_TIMEOUT: number;
}

export const authorizationClientConfig: AuthorizationClientConfig = {
	basePath: `${Configuration.get('API_HOST') as string}/v3/`,
};

const h5pEditorConfig: H5PEditorConfig = {
	NEST_LOG_LEVEL: Configuration.get('NEST_LOG_LEVEL') as string,
	INCOMING_REQUEST_TIMEOUT: Configuration.get('H5P_EDITOR__INCOMING_REQUEST_TIMEOUT') as number,
	...authorizationClientConfig,
	EXIT_ON_ERROR: Configuration.get('EXIT_ON_ERROR') as boolean,
};

export const translatorConfig = {
	AVAILABLE_LANGUAGES: (Configuration.get('I18N__AVAILABLE_LANGUAGES') as string).split(',') as LanguageType[],
};

export const H5P_CONTENT_S3_CONNECTION = 'H5P_CONTENT_S3_CONNECTION';
export const H5P_LIBRARIES_S3_CONNECTION = 'H5P_LIBRARIES_S3_CONNECTION';

export const s3ConfigContent: S3Config = {
	connectionName: H5P_CONTENT_S3_CONNECTION,
	endpoint: Configuration.get('H5P_EDITOR__S3_ENDPOINT') as string,
	region: Configuration.get('H5P_EDITOR__S3_REGION') as string,
	bucket: Configuration.get('H5P_EDITOR__S3_BUCKET_CONTENT') as string,
	accessKeyId: Configuration.get('H5P_EDITOR__S3_ACCESS_KEY_ID') as string,
	secretAccessKey: Configuration.get('H5P_EDITOR__S3_SECRET_ACCESS_KEY') as string,
};

export const s3ConfigLibraries: S3Config = {
	connectionName: H5P_LIBRARIES_S3_CONNECTION,
	endpoint: Configuration.get('H5P_EDITOR__S3_ENDPOINT') as string,
	region: Configuration.get('H5P_EDITOR__S3_REGION') as string,
	bucket: Configuration.get('H5P_EDITOR__S3_BUCKET_LIBRARIES') as string,
	accessKeyId: Configuration.get('H5P_EDITOR__LIBRARIES_S3_ACCESS_KEY_ID') as string,
	secretAccessKey: Configuration.get('H5P_EDITOR__LIBRARIES_S3_SECRET_ACCESS_KEY') as string,
};

export const config = () => h5pEditorConfig;
