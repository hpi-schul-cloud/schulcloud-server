import { ConfigProperty, Configuration } from '@infra/configuration';
import { SchulcloudTheme } from '@shared/domain/types';
import { IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';

export const MANAGEMENT_SEED_DATA_CONFIG_TOKEN = 'MANAGEMENT_SEED_DATA_CONFIG_TOKEN';

@Configuration()
export class ManagementSeedDataConfig {
	@ConfigProperty('SC_THEME')
	@IsEnum(SchulcloudTheme)
	public scTheme = SchulcloudTheme.DEFAULT;

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

	@ConfigProperty('BRANDENBURG_CLIENT_ID')
	@IsString()
	@IsOptional()
	public brandenburgClientId?: string;

	@ConfigProperty('BRANDENBURG_CLIENT_SECRET')
	@IsString()
	@IsOptional()
	public brandenburgClientSecret?: string;

	@ConfigProperty('BRANDENBURG_AUTH_ENDPOINT')
	@IsUrl({ require_tld: false })
	@IsOptional()
	public brandenburgAuthEndpoint?: string;

	@ConfigProperty('BRANDENBURG_TOKEN_ENDPOINT')
	@IsUrl({ require_tld: false })
	@IsOptional()
	public brandenburgTokenEndpoint?: string;

	@ConfigProperty('BRANDENBURG_JWKS_ENDPOINT')
	@IsUrl({ require_tld: false })
	@IsOptional()
	public brandenburgJwksEndpoint?: string;

	@ConfigProperty('BRANDENBURG_ISSUER')
	@IsUrl({ require_tld: false })
	@IsOptional()
	public brandenburgIssuer?: string;

	@ConfigProperty('BRANDENBURG_END_SESSION_ENDPOINT')
	@IsUrl({ require_tld: false })
	@IsOptional()
	public brandenburgEndSessionEndpoint?: string;

	@ConfigProperty('BRANDENBURG_PROVISIONING_URL')
	@IsUrl({ require_tld: false })
	@IsOptional()
	public brandenburgProvisioningUrl?: string;

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

	@ConfigProperty('CTL_SEED_BILO_LTI_KEY')
	@IsString()
	@IsOptional()
	public ctlSeedBiloLtiKey?: string;

	@ConfigProperty('CTL_SEED_BILO_LTI_SECRET')
	@IsString()
	@IsOptional()
	public ctlSeedBiloLtiSecret?: string;

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
}
