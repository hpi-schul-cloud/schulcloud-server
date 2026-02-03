import { InternalCollaborativeStorageAdapterConfig } from '@infra/collaborative-storage';
import { ConfigProperty, Configuration } from '@infra/configuration';
import { IsString, IsUrl } from 'class-validator';

export const COLLABORATIVE_STORAGE_CONFIG_TOKEN = 'COLLABORATIVE_STORAGE_CONFIG_TOKEN';

@Configuration()
export class CollaborativeStorageConfig implements InternalCollaborativeStorageAdapterConfig {
	@ConfigProperty('NEXTCLOUD_BASE_URL')
	@IsUrl({ require_tld: false })
	public nextcloudBaseUrl = 'http://nextcloud.localhost:9090';

	@ConfigProperty('NEXTCLOUD_ADMIN_USERNAME')
	@IsString()
	public nextcloudAdminUsername = 'admin';

	@ConfigProperty('NEXTCLOUD_ADMIN_PASSWORD')
	@IsString()
	public nextcloudAdminPassword = 'admin';

	@ConfigProperty('NEXTCLOUD_SOCIALLOGIN_OIDC_INTERNAL_NAME')
	@IsString()
	public oidcInternalName = 'SchulcloudNextcloud';
}
