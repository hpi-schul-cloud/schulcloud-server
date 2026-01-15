import { ConfigProperty, Configuration } from '@infra/configuration';
import { Transform } from 'class-transformer';
import { IsArray } from 'class-validator';
import { InternalXApiKeyAuthGuardConfig } from '../interface';

export const X_API_KEY_AUTH_GUARD_CONFIG_TOKEN = 'X_API_KEY_AUTH_GUARD_CONFIG_TOKEN';

/**
 * This is Configuration for the X-API-KEY auth guard.
 */
@Configuration()
export class XApiKeyAuthGuardConfig implements InternalXApiKeyAuthGuardConfig {
	@ConfigProperty('ADMIN_API__ALLOWED_API_KEYS')
	@Transform(({ value }: { value: string }) =>
		value.split(',').map((part: string) => (part.split(':').pop() ?? '').trim())
	)
	@IsArray()
	public allowedApiKeys: string[] = [];
}
