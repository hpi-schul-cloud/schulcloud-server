import { ConfigProperty, Configuration } from '@infra/configuration';
import { IsOptional, IsString, IsUrl } from 'class-validator';

export const MANAGEMENT_SEED_DATA_CONFIG_TOKEN = 'MANAGEMENT_SEED_DATA_CONFIG_TOKEN';

@Configuration()
export class ManagementSeedDataConfig {
	@ConfigProperty('SC_THEME')
	@IsString()
	public scTheme = 'default';

	@ConfigProperty('SC_SHORTNAME')
	@IsString()
	public scShortName = 'dbc';

	@ConfigProperty('SCHULCONNEX_CLIENT_ID')
	@IsString()
	@IsOptional()
	public schulconnexClientId?: string;

	@ConfigProperty('SCHULCONNEX_CLIENT_SECRET')
	@IsString()
	@IsOptional()
	public schulconnexClientSecret?: string;

	@ConfigProperty('MEDIA_SOURCE_VIDIS_USERNAME')
	@IsString()
	@IsOptional()
	public mediaSourceVidisUsername?: string;

	@ConfigProperty('MEDIA_SOURCE_VIDIS_PASSWORD')
	@IsString()
	@IsOptional()
	public mediaSourceVidisPassword?: string;

	@ConfigProperty('MEDIA_SOURCE_BILO_CLIENT_ID')
	@IsString()
	@IsOptional()
	public mediaSourceBiloClientId?: string;

	@ConfigProperty('MEDIA_SOURCE_BILO_CLIENT_SECRET')
	@IsString()
	@IsOptional()
	public mediaSourceBiloClientSecret?: string;

	@ConfigProperty('NEXTCLOUD_SOCIALLOGIN_OIDC_INTERNAL_NAME')
	@IsString()
	public nextcloudSocialloginOidcInternalName = 'SchulcloudNextcloud';

	@ConfigProperty('NEXTCLOUD_BASE_URL')
	@IsUrl({ require_tld: false })
	public nextcloudBaseUrl = 'http://nextcloud.localhost:9090';

	@ConfigProperty('NEXTCLOUD_CLIENT_ID')
	@IsString()
	@IsOptional()
	public nextcloudClientId?: string;

	@ConfigProperty('NEXTCLOUD_CLIENT_SECRET')
	@IsString()
	@IsOptional()
	public nextcloudClientSecret?: string;

	@ConfigProperty('NEXTCLOUD_SCOPES')
	@IsString()
	public nextcloudScopes = 'openid offline profile email groups';

	@ConfigProperty('CTL_SEED_SECRET_ONLINE_DIA_MATHE')
	@IsString()
	@IsOptional()
	public ctlSeedSecretOnlineDiaMathe?: string;

	@ConfigProperty('CTL_SEED_SECRET_ONLINE_DIA_DEUTSCH')
	@IsString()
	@IsOptional()
	public ctlSeedSecretOnlineDiaDeutsch?: string;

	@ConfigProperty('CTL_SEED_SECRET_MERLIN')
	@IsString()
	@IsOptional()
	public ctlSeedSecretMerlin?: string;

	@ConfigProperty('OIDCMOCK__BASE_URL')
	@IsUrl({ require_tld: false })
	public oidcMockBaseUrl = 'http://127.0.0.1:4011';

	@ConfigProperty('OIDCMOCK__CLIENT_ID')
	@IsString()
	public oidcMockClientId = 'erwin-credentials-mock-client';

	@ConfigProperty('OIDCMOCK__CLIENT_SECRET')
	@IsString()
	public oidcMockClientSecret = 'erwin-credentials-mock-client-secret';
}
