import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean } from '@shared/controller/transformer';
import { IsBoolean } from 'class-validator';

export const IDENTITY_MANAGEMENT_CONFIG_TOKEN = 'IDENTITY_MANAGEMENT_CONFIG_TOKEN';

@Configuration()
export class IdentityManagementConfig {
	@ConfigProperty('FEATURE_IDENTITY_MANAGEMENT_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public featureEnabled = false;

	@ConfigProperty('FEATURE_IDENTITY_MANAGEMENT_STORE_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public storeEnabled = false;

	@ConfigProperty('FEATURE_IDENTITY_MANAGEMENT_LOGIN_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public loginEnabled = false;
}
