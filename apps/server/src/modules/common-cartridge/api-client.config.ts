import { InternalAuthorizationClientConfig } from '@infra/authorization-client';
import { ConfigProperty, Configuration } from '@infra/configuration';
import { IsUrl } from 'class-validator';

export const API_HOST_CONFIG_TOKEN = 'API_HOST_CONFIG_TOKEN';

@Configuration()
export class ApiHostConfig implements InternalAuthorizationClientConfig {
	@ConfigProperty('API_HOST')
	@IsUrl({ require_tld: false })
	public basePath!: string;
}
