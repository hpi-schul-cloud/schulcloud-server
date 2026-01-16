import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean } from '@shared/controller/transformer';
import { IsBoolean } from 'class-validator';

export const OAUTH_PUBLIC_API_CONFIG_TOKEN = 'OAUTH_PUBLIC_API_CONFIG_TOKEN';

@Configuration()
export class OauthPublicApiConfig {
	@ConfigProperty('FEATURE_LOGIN_LINK_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public featureLoginLinkEnabled = false;

	@ConfigProperty('FEATURE_EXTERNAL_SYSTEM_LOGOUT_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public featureExternalSystemLogoutEnabled = false;
}
