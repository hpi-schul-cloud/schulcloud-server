import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean } from '@shared/controller/transformer';
import { IsBoolean } from 'class-validator';

export const OAUTH_CONFIG_TOKEN = 'OAUTH_CONFIG_TOKEN';

@Configuration()
export class OauthConfig {
	@ConfigProperty('FEATURE_LOGIN_LINK_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public featureLoginLinkEnabled!: boolean;
}
