import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean, StringToNumber } from '@shared/controller/transformer';
import { IsBoolean, IsNumber } from 'class-validator';

export const USER_LOGIN_MIGRATION_PUBLIC_API_CONFIG_TOKEN = 'USER_LOGIN_MIGRATION_PUBLIC_API_CONFIG_TOKEN';

@Configuration()
export class UserLoginMigrationPublicApiConfig {
	@ConfigProperty('MIGRATION_END_GRACE_PERIOD_MS')
	@IsNumber()
	@StringToNumber()
	public migrationEndGracePeriodMs = 604800000;

	@ConfigProperty('FEATURE_USER_LOGIN_MIGRATION_ENABLED')
	@IsBoolean()
	@StringToBoolean()
	public featureUserLoginMigrationEnabled = false;

	@ConfigProperty('FEATURE_SHOW_MIGRATION_WIZARD')
	@IsBoolean()
	@StringToBoolean()
	public featureShowMigrationWizard = false;

	@ConfigProperty('FEATURE_SHOW_OUTDATED_USERS')
	@IsBoolean()
	@StringToBoolean()
	public featureShowOutdatedUsers = false;
}
