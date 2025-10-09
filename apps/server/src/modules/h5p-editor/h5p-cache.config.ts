import { ConfigProperty, Configuration } from '@infra/configuration';
import { KeyvValkeyOptions } from '@keyv/valkey';
import { IsEnum, IsOptional, IsString, IsUrl, ValidateIf } from 'class-validator';

export const H5P_CACHE_CONFIG_TOKEN = 'H5P_CACHE_CONFIG_TOKEN';

export enum CacheMode {
	CLUSTER = 'cluster',
	SINGLE = 'single',
	IN_MEMORY = 'in-memory',
}

@Configuration()
export class H5PCacheConfig implements KeyvValkeyOptions {
	@IsEnum(CacheMode)
	@IsOptional()
	@ConfigProperty('SESSION_VALKEY__MODE')
	public mode!: CacheMode;

	@IsUrl({ protocols: ['redis'], require_tld: false })
	@ValidateIf((o: H5PCacheConfig) => o.mode === CacheMode.CLUSTER || o.mode === CacheMode.SINGLE)
	@ConfigProperty('SESSION_VALKEY__URI')
	public uri!: string;

	@IsString()
	@ValidateIf((o: H5PCacheConfig) => o.mode === CacheMode.CLUSTER)
	public sentinelServiceName!: string;

	@IsString()
	@ConfigProperty('SESSION_VALKEY__SENTINEL_NAME')
	public sentinelName = 'myprimary';

	@IsString()
	@ValidateIf((o: H5PCacheConfig) => o.mode === CacheMode.CLUSTER)
	@ConfigProperty('SESSION_VALKEY__SENTINEL_PASSWORD')
	public sentinelPassword!: string;
}
