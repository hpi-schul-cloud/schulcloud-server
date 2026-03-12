import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToNumber } from '@shared/controller/transformer';
import { IsNumber } from 'class-validator';
import { JWT_WHITELIST_CONFIG_TOKEN } from '../auth-guard.constants';

export { JWT_WHITELIST_CONFIG_TOKEN };

@Configuration()
export class JwtWhitelistConfig {
	@ConfigProperty('JWT_TIMEOUT_SECONDS')
	@StringToNumber()
	@IsNumber()
	public jwtTimeoutSeconds = 7200;
}
