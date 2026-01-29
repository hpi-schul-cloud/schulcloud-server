import { ConfigProperty, Configuration } from '@infra/configuration';
import { IsOptional, IsString } from 'class-validator';

export const H5P_CACHE_CONFIG_TOKEN = 'H5P_CACHE_CONFIG_TOKEN';

@Configuration()
export class H5PCacheConfig {
	@IsString()
	@ConfigProperty('DB_URL')
	public DB_URL!: string;

	@IsString()
	@IsOptional()
	@ConfigProperty('DB_USERNAME')
	public DB_USERNAME!: string;

	@IsString()
	@IsOptional()
	@ConfigProperty('DB_PASSWORD')
	public DB_PASSWORD!: string;

	@IsString()
	@IsOptional()
	@ConfigProperty('H5P_CACHE_COLLECTION_NAME')
	public DB_COLLECTION_NAME = 'h5p-cache';
}
