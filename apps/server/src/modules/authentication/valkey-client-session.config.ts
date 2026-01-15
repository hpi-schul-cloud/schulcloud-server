import { ConfigProperty, Configuration } from '@infra/configuration';
import { ValkeyConfig, ValkeyMode } from '@infra/valkey-client';
import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';

export const SESSION_VALKEY_CLIENT = 'SESSION_VALKEY_CLIENT';
export const SESSION_VALKEY_CLIENT_CONFIG_TOKEN = 'SESSION_VALKEY_CLIENT_CONFIG_TOKEN';

@Configuration()
export class ValkeyClientSessionConfig implements ValkeyConfig {
	@ConfigProperty('SESSION_VALKEY__MODE')
	@IsEnum(ValkeyMode)
	public MODE!: ValkeyMode;

	@ConfigProperty('SESSION_VALKEY__URI')
	@IsOptional()
	@IsString()
	@ValidateIf((o: ValkeyClientSessionConfig) => o.MODE === ValkeyMode.SINGLE)
	public URI?: string;

	@ConfigProperty('SESSION_VALKEY__SENTINEL_NAME')
	@IsOptional()
	@IsString()
	@ValidateIf((o: ValkeyClientSessionConfig) => o.MODE === ValkeyMode.CLUSTER)
	public SENTINEL_NAME?: string;

	@ConfigProperty('SESSION_VALKEY__SENTINEL_PASSWORD')
	@IsOptional()
	@IsString()
	@ValidateIf((o: ValkeyClientSessionConfig) => o.MODE === ValkeyMode.CLUSTER)
	public SENTINEL_PASSWORD?: string;

	@ConfigProperty('SESSION_VALKEY__SENTINEL_SERVICE_NAME')
	@IsOptional()
	@IsString()
	@ValidateIf((o: ValkeyClientSessionConfig) => o.MODE === ValkeyMode.CLUSTER)
	public SENTINEL_SERVICE_NAME?: string;
}
