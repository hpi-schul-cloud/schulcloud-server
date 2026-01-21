import { ConfigProperty, Configuration } from '@infra/configuration';
import { IsUrl } from 'class-validator';
import { ConfigurationParameters } from './authorization-api-client';

export interface InternalAuthorizationClientConfig extends ConfigurationParameters {
	basePath: string;
}

export const AUTHORIZATION_CLIENT_CONFIG_TOKEN = 'AUTHORIZATION_CLIENT_CONFIG_TOKEN';

/**
 * This is default Configuration for the API_HOST in AuthorizationClient.
 * if you need to read values from different env variables, create your own config class
 * implementing InternalAuthorizationClientConfig and provide it via the AuthorizationModule.register method.
 */
@Configuration()
export class AuthorizationClientConfig implements InternalAuthorizationClientConfig {
	@ConfigProperty('API_HOST')
	@IsUrl({ require_tld: false })
	public basePath!: string;
}
