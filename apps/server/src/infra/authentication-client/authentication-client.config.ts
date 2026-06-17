import { ConfigProperty, Configuration } from '@infra/configuration';
import { IsUrl } from 'class-validator';
import { ConfigurationParameters } from './generated';

export interface InternalAuthenticationClientConfig extends ConfigurationParameters {
	basePath: string;
}

export const AUTHENTICATION_CLIENT_CONFIG_TOKEN = 'AUTHENTICATION_CLIENT_CONFIG_TOKEN';

/**
 * This is default Configuration for the API_HOST in AuthenticationClient.
 * if you need to read values from different env variables, create your own config class
 * implementing InternalAuthenticationClientConfig and provide it via the AuthenticationClientModule.register method.
 */
@Configuration()
export class AuthenticationClientConfig implements InternalAuthenticationClientConfig {
	@ConfigProperty('API_HOST')
	@IsUrl({ require_tld: false })
	public basePath!: string;
}
