import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean, StringToNumber } from '@shared/controller/transformer';
import { IsBoolean, IsNumber } from 'class-validator';

export const AUTHENTICATION_CONFIG_TOKEN = 'AUTHENTICATION_CONFIG_TOKEN';

@Configuration()
export class AuthenticationConfig {
	@ConfigProperty('JWT_LIFETIME_SUPPORT_SECONDS')
	@StringToNumber()
	@IsNumber()
	public jwtLifetimeSupportSeconds = 604800;

	@ConfigProperty('LOGIN_BLOCK_TIME')
	@StringToNumber()
	@IsNumber()
	public loginBlockTime = 900;

	@ConfigProperty('FEATURE_EXTERNAL_SYSTEM_LOGOUT_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public featureExternalSystemLogoutEnabled = false;
}
