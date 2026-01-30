import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean } from '@shared/controller/transformer';
import { IsBoolean } from 'class-validator';

export const REGISTRATION_PUBLIC_API_CONFIG_TOKEN = 'REGISTRATION_PUBLIC_API_CONFIG_TOKEN';

@Configuration()
export class RegistrationPublicApiConfig {
	@ConfigProperty('FEATURE_EXTERNAL_PERSON_REGISTRATION_ENABLED')
	@IsBoolean()
	@StringToBoolean()
	public featureExternalPersonRegistrationEnabled = false;
}
