import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToNumber } from '@shared/controller/transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export const SCHULCONNEX_CLIENT_CONFIG_TOKEN = 'SCHULCONNEX_CLIENT_CONFIG_TOKEN';

@Configuration()
export class SchulconnexClientConfig {
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
	public apiUrl = '';

	@ConfigProperty('SCHULCONNEX_CLIENT__TOKEN_ENDPOINT')
	@IsOptional()
	@IsString()
	public tokenEndpoint = '';

	@ConfigProperty('SCHULCONNEX_CLIENT__CLIENT_ID')
	@IsOptional()
	@IsString()
	public clientId = '';

	@ConfigProperty('SCHULCONNEX_CLIENT__CLIENT_SECRET')
	@IsOptional()
	@IsString()
	public clientSecret = '';
}
