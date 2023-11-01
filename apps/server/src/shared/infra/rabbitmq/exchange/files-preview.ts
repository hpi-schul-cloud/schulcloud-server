import { Configuration } from '@hpi-schul-cloud/commons/lib';

export const FilesPreviewExchange = Configuration.get('FILES_STORAGE__EXCHANGE') as string;

export enum FilesPreviewEvents {
	'GENERATE_PREVIEW' = 'generate-preview',
}
