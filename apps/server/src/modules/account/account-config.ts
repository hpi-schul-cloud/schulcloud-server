import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean } from '@shared/controller/transformer';
import { IsBoolean } from 'class-validator';

export const ACCOUNT_CONFIG_TOKEN = 'ACCOUNT_CONFIG_TOKEN';

@Configuration()
export class AccountConfig {
	@ConfigProperty('FEATURE_IDENTITY_MANAGEMENT_LOGIN_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public identityManagementLoginEnabled = false;

	@ConfigProperty('FEATURE_IDENTITY_MANAGEMENT_STORE_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public identityManagementStoreEnabled = false;
}
