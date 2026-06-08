import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToNumber } from '@shared/controller/transformer';
import { IsNumber } from 'class-validator';

export const DEFAULT_JWT_WHITELIST_CONFIG_TOKEN = 'DEFAULT_JWT_WHITELIST_CONFIG_TOKEN';

@Configuration()
export class DefaultJwtWhitelistConfig {
	@ConfigProperty('JWT_TIMEOUT_SECONDS')
	@StringToNumber()
	@IsNumber()
	public jwtTimeoutSeconds = 7200;
}
