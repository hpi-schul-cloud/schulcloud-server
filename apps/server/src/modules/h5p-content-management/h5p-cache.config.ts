import { ConfigProperty, Configuration } from '@infra/configuration';
import { IsOptional, IsString, IsUrl } from 'class-validator';

export const H5P_CACHE_CONFIG_TOKEN = 'H5P_CACHE_CONFIG_TOKEN';

@Configuration()
export class H5PCacheConfig {
	@ConfigProperty('DB_URL')
	@IsUrl({ require_tld: false, require_protocol: false, protocols: ['mongodb', 'mongodb+srv'] })
	public dbUrl!: string;

	@IsString()
	@IsOptional()
	@ConfigProperty('DB_USERNAME')
	public dbUsername?: string;

	@IsString()
	@IsOptional()
	@ConfigProperty('DB_PASSWORD')
	public dbPassword?: string;

	@IsString()
	@IsOptional()
	@ConfigProperty('H5P_CACHE_COLLECTION_NAME')
	public dbCollectionName = 'h5p-cache';
}
