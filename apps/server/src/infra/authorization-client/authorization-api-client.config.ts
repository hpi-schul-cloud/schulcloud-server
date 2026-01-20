import { ConfigProperty, Configuration } from '@infra/configuration';
import { IsUrl } from 'class-validator';
import { ConfigurationParameters } from './authorization-api-client';

export interface InternalAuthorizationClientConfig extends ConfigurationParameters {
	basePath: string;
}

export const AUTHORIZATION_API_CONFIG_TOKEN = 'AUTHORIZATION_API_CONFIG_TOKEN';

@Configuration()
export class AuthorizationClientConfig implements InternalAuthorizationClientConfig {
	@ConfigProperty('API_HOST')
	@IsUrl({ require_tld: false })
	public basePath!: string;
}
