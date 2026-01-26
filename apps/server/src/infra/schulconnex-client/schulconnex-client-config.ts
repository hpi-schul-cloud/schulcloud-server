import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToNumber } from '@shared/controller/transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export interface InternalSchulconnexClientConfig {
	personInfoTimeoutInMs: number;
	personenInfoTimeoutInMs: number;
	policiesInfoTimeoutInMs: number;
	apiUrl?: string;
	tokenEndpoint?: string;
	clientId?: string;
	clientSecret?: string;
}

export const SCHULCONNEX_CLIENT_CONFIG_TOKEN = 'SCHULCONNEX_CLIENT_CONFIG_TOKEN';

/**
 * This is default Configuration for the SchulconnexClient.
 * if you need to read values from different env variables, create your own config class
 * implementing InternalSchulconnexClientConfig and provide it via the SchulconnexModule.register method.
 */
@Configuration()
export class SchulconnexClientConfig implements InternalSchulconnexClientConfig {
	@ConfigProperty('SCHULCONNEX_CLIENT__PERSON_INFO_TIMEOUT_IN_MS')
	@StringToNumber()
	@IsNumber()
	public personInfoTimeoutInMs = 3000;

	@ConfigProperty('SCHULCONNEX_CLIENT__PERSONEN_INFO_TIMEOUT_IN_MS')
	@StringToNumber()
	@IsNumber()
	public personenInfoTimeoutInMs = 120000;

	@ConfigProperty('SCHULCONNEX_CLIENT__POLICIES_INFO_TIMEOUT_IN_MS')
	@StringToNumber()
	@IsNumber()
	public policiesInfoTimeoutInMs = 4000;

	@ConfigProperty('SCHULCONNEX_CLIENT__API_URL')
	@IsOptional()
	@IsString()
	public apiUrl?: string;

	@ConfigProperty('SCHULCONNEX_CLIENT__TOKEN_ENDPOINT')
	@IsOptional()
	@IsString()
	public tokenEndpoint?: string;

	@ConfigProperty('SCHULCONNEX_CLIENT__CLIENT_ID')
	@IsOptional()
	@IsString()
	public clientId?: string;

	@ConfigProperty('SCHULCONNEX_CLIENT__CLIENT_SECRET')
	@IsOptional()
	@IsString()
	public clientSecret?: string;
}
