import { ConfigProperty, Configuration } from '@infra/configuration';
import { ValkeyConfig, ValkeyMode } from '@infra/valkey-client';
import { IsEnum, IsOptional, IsString, IsUrl, ValidateIf } from 'class-validator';

export const H5P_CACHE_CONFIG_TOKEN = 'H5P_CACHE_CONFIG_TOKEN';


@Configuration()
export class H5PCacheConfig implements ValkeyConfig {
	@IsEnum(ValkeyMode)
	@IsOptional()
	@ConfigProperty('SESSION_VALKEY__MODE')
	public MODE!: ValkeyMode;

	@IsUrl({ protocols: ['redis'], require_tld: false })
	@ValidateIf((o: H5PCacheConfig) => o.MODE === ValkeyMode.CLUSTER || o.MODE === ValkeyMode.SINGLE)
	@ConfigProperty('SESSION_VALKEY__URI')
	public URI!: string;

	@IsString()
	@ValidateIf((o: H5PCacheConfig) => o.MODE === ValkeyMode.CLUSTER)
	public sentinelServiceName!: string;

	@IsString()
	@ConfigProperty('SESSION_VALKEY__SENTINEL_NAME')
	public sentinelName = 'myprimary';

	@IsString()
	@ValidateIf((o: H5PCacheConfig) => o.MODE === ValkeyMode.CLUSTER)
	@ConfigProperty('SESSION_VALKEY__SENTINEL_PASSWORD')
	public sentinelPassword!: string;
}
