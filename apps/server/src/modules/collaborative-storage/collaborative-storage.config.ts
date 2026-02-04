import { InternalCollaborativeStorageAdapterConfig } from '@infra/collaborative-storage';
import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean } from '@shared/controller/transformer';
import { IsBoolean, IsString, IsUrl, ValidateIf } from 'class-validator';

export const COLLABORATIVE_STORAGE_CONFIG_TOKEN = 'COLLABORATIVE_STORAGE_CONFIG_TOKEN';

@Configuration()
export class CollaborativeStorageConfig implements InternalCollaborativeStorageAdapterConfig {
	@ConfigProperty('FEATURE_NEXTCLOUD_TEAM_FILES_ENABLED')
	@IsBoolean()
	@StringToBoolean()
	public featureNextcloudTeamFilesEnabled = false;

	@ConfigProperty('NEXTCLOUD_BASE_URL')
	@IsUrl({ require_tld: false })
	@ValidateIf((config: CollaborativeStorageConfig) => config.featureNextcloudTeamFilesEnabled)
	public nextcloudBaseUrl!: string;

	@ConfigProperty('NEXTCLOUD_ADMIN_USERNAME')
	@IsString()
	@ValidateIf((config: CollaborativeStorageConfig) => config.featureNextcloudTeamFilesEnabled)
	public nextcloudAdminUsername!: string;

	@ConfigProperty('NEXTCLOUD_ADMIN_PASSWORD')
	@IsString()
	@ValidateIf((config: CollaborativeStorageConfig) => config.featureNextcloudTeamFilesEnabled)
	public nextcloudAdminPassword!: string;

	@ConfigProperty('NEXTCLOUD_SOCIALLOGIN_OIDC_INTERNAL_NAME')
	@IsString()
	@ValidateIf((config: CollaborativeStorageConfig) => config.featureNextcloudTeamFilesEnabled)
	public oidcInternalName!: string;
}
