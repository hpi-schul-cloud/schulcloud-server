import { ConfigProperty, Configuration } from '@infra/configuration';
import { IsString, IsUrl } from 'class-validator';

export interface InternalCollaborativeStorageAdapterConfig {
	nextcloudBaseUrl: string;
	nextcloudAdminUsername: string;
	nextcloudAdminPassword: string;
	oidcInternalName: string;
}

export const COLLABORATIVE_STORAGE_ADAPTER_CONFIG_TOKEN = 'COLLABORATIVE_STORAGE_ADAPTER_CONFIG_TOKEN';

@Configuration()
export class CollaborativeStorageAdapterConfig {
	@ConfigProperty('NEXTCLOUD_BASE_URL')
	@IsUrl()
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
