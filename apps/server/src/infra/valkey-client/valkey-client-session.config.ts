import { ConfigProperty, Configuration } from '@infra/configuration';
import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';
import { ValkeyConfig, ValkeyMode } from './valkey.config';

/**
 * This is default Configuration for the Valkey Client used for Session Storage.
 * If you need a different configuration, please create a custom one.
 * Based on the ValkeyConfig interface and logic of @ValidateIf decorators from this class
 */
export const SESSION_VALKEY_CLIENT_CONFIG_TOKEN = 'SESSION_VALKEY_CLIENT_CONFIG_TOKEN';

@Configuration()
export class ValkeyClientSessionConfig implements ValkeyConfig {
	@ConfigProperty('SESSION_VALKEY__MODE')
	@IsEnum(ValkeyMode)
	public mode!: ValkeyMode;

	@ConfigProperty('SESSION_VALKEY__URI')
	@IsOptional()
	@IsString()
	@ValidateIf((o: ValkeyClientSessionConfig) => o.mode === ValkeyMode.SINGLE)
	public uri?: string;

	@ConfigProperty('SESSION_VALKEY__SENTINEL_NAME')
	@IsOptional()
	@IsString()
	@ValidateIf((o: ValkeyClientSessionConfig) => o.mode === ValkeyMode.CLUSTER)
	public sentinelName?: string;

	@ConfigProperty('SESSION_VALKEY__SENTINEL_PASSWORD')
	@IsOptional()
	@IsString()
	@ValidateIf((o: ValkeyClientSessionConfig) => o.mode === ValkeyMode.CLUSTER)
	public sentinelPassword?: string;

	@ConfigProperty('SESSION_VALKEY__SENTINEL_SERVICE_NAME')
	@IsOptional()
	@IsString()
	@ValidateIf((o: ValkeyClientSessionConfig) => o.mode === ValkeyMode.CLUSTER)
	public sentinelServiceName?: string;
}
