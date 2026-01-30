import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToApiKeys } from '@shared/controller/transformer';
import { IsArray } from 'class-validator';
import { InternalXApiKeyAuthGuardConfig } from '../interface';

export const X_API_KEY_AUTH_GUARD_CONFIG_TOKEN = 'X_API_KEY_AUTH_GUARD_CONFIG_TOKEN';

/**
 * This is default Configuration for the X-API-KEY auth guard.
 * if you need to read values from different env variables, create your own config class
 * implementing InternalXApiKeyAuthGuardConfig and provide it via the AuthGuardModule.register method.
 */
@Configuration()
export class XApiKeyAuthGuardConfig implements InternalXApiKeyAuthGuardConfig {
	@ConfigProperty('ADMIN_API__ALLOWED_API_KEYS')
	@StringToApiKeys()
	@IsArray()
	public allowedApiKeys: string[] = [];
}
