import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean } from '@shared/controller/transformer';
import { IsBoolean, IsEmail, IsString, IsUrl } from 'class-validator';

export const REGISTRATION_PUBLIC_API_CONFIG_TOKEN = 'REGISTRATION_PUBLIC_API_CONFIG_TOKEN';
export const REGISTRATION_CONFIG_TOKEN = 'REGISTRATION_CONFIG_TOKEN';

@Configuration()
export class RegistrationPublicApiConfig {
	@ConfigProperty('FEATURE_EXTERNAL_PERSON_REGISTRATION_ENABLED')
	@IsBoolean()
	@StringToBoolean()
	public featureExternalPersonRegistrationEnabled = false;
}

@Configuration()
export class RegistrationConfig extends RegistrationPublicApiConfig {
	@IsUrl({ require_tld: false })
	@ConfigProperty('HOST')
	public hostUrl!: string;

	@ConfigProperty('SMTP_SENDER')
	@IsEmail()
	public fromEmailAddress = 'noreply@dbildungscloud.de';

	@ConfigProperty('SC_TITLE')
	@IsString()
	public scTitle = 'dBildungscloud';
}
