import { ConfigProperty, Configuration } from '@infra/configuration';
import { IsString } from 'class-validator';

export const OAUTH_PROVIDER_CONFIG_TOKEN = 'OAUTH_PROVIDER_CONFIG_TOKEN';

@Configuration()
export class OauthProviderConfig {
	@ConfigProperty('HYDRA_URI')
	@IsString()
	public hydraUri!: string;
}
