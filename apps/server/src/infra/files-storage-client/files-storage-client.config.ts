import { ConfigProperty, Configuration } from '@infra/configuration';
import { IsUrl } from 'class-validator';
import { ConfigurationParameters } from './generated';

export interface InternalFilesStorageClientConfig extends ConfigurationParameters {
	basePath: string;
}

export const FILE_STORAGE_CLIENT_CONFIG_TOKEN = 'FILE_STORAGE_CLIENT_CONFIG_TOKEN';

/**
 * This is default Configuration for the FILES_STORAGE__SERVICE_BASE_URL in FileStorageClient.
 * if you need to read values from different env variables, create your own config class
 * implementing InternalFileStorageClientConfig and provide it via the FileStorageClientModule.register method.
 */
@Configuration()
export class FileStorageClientConfig implements InternalFilesStorageClientConfig {
	@ConfigProperty('FILES_STORAGE__SERVICE_BASE_URL')
	@IsUrl({ require_tld: false })
	public basePath!: string;
}
