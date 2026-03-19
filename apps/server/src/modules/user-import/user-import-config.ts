import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean, StringToNumber } from '@shared/controller/transformer';
import { IsBoolean, IsOptional, IsString, ValidateIf } from 'class-validator';

export const USER_IMPORT_PUBLIC_API_CONFIG_TOKEN = 'USER_IMPORT_PUBLIC_API_CONFIG_TOKEN';
export const USER_IMPORT_CONFIG_TOKEN = 'USER_IMPORT_CONFIG_TOKEN';

@Configuration()
export class UserImportPublicApiConfig {
	@ConfigProperty('FEATURE_USER_MIGRATION_ENABLED')
	@IsBoolean()
	@StringToBoolean()
	public featureUserMigrationEnabled = false;

	@ConfigProperty('MIGRATION_WIZARD_DOCUMENTATION_LINK')
	@StringToNumber()
	@IsOptional()
	public migrationWizardDocumentationLink?: string;
}

@Configuration()
export class UserImportConfig extends UserImportPublicApiConfig {
	@ConfigProperty('FEATURE_USER_MIGRATION_SYSTEM_ID')
	@IsString()
	@ValidateIf((config: UserImportConfig) => config.featureUserMigrationEnabled)
	public featureUserMigrationSystemId = '';

	@ConfigProperty('FEATURE_MIGRATION_WIZARD_WITH_USER_LOGIN_MIGRATION')
	@IsBoolean()
	@StringToBoolean()
	@ValidateIf((config: UserImportConfig) => config.featureUserMigrationEnabled)
	public featureMigrationWizardWithUserLoginMigration = false;
}
