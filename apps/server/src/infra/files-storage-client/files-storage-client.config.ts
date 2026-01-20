import { ConfigProperty, Configuration } from '@infra/configuration';
import { IsUrl } from 'class-validator';
import { ConfigurationParameters } from './generated';

export interface InternalFilesStorageClientConfig extends ConfigurationParameters {
	basePath: string;
}

export const FILE_STORAGE_API_HOST_CONFIG_TOKEN = 'FILE_STORAGE_API_HOST_CONFIG_TOKEN';

@Configuration()
export class FileStorageClientConfig implements InternalFilesStorageClientConfig {
	@ConfigProperty('FILES_STORAGE__SERVICE_BASE_URL')
	@IsUrl({ require_tld: false })
	public basePath!: string;
}
