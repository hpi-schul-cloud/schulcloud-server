import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean, StringToNumber } from '@shared/controller/transformer';
import { IsBoolean, IsNumber, IsString } from 'class-validator';

export const SESSION_VALKEY_CLIENT = 'SESSION_VALKEY_CLIENT';

const hourInSeconds = 3600;
const dayInSeconds = 24 * hourInSeconds;

export const AUTHENTICATION_CONFIG_TOKEN = 'AUTHENTICATION_CONFIG_TOKEN';
@Configuration()
export class AuthenticationConfig {
	// Also used in JwtModuleConfig.
	@ConfigProperty('JWT_LIFETIME')
	@IsString()
	public expiresIn = '30d';

	@ConfigProperty('JWT_LIFETIME_SUPPORT_SECONDS')
	@StringToNumber()
	@IsNumber()
	public jwtLifetimeSupportSeconds = 7 * dayInSeconds;

	@ConfigProperty('JWT_LIFETIME_SYSTEM_USER_SECONDS')
	@StringToNumber()
	@IsNumber()
	public jwtLifetimeSystemUserSeconds = 2 * hourInSeconds;

	@ConfigProperty('LOGIN_BLOCK_TIME')
	@StringToNumber()
	@IsNumber()
	public loginBlockTime = 900;

	@ConfigProperty('FEATURE_EXTERNAL_SYSTEM_LOGOUT_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public externalSystemLogoutEnabled = false;

	@ConfigProperty('FEATURE_IDENTITY_MANAGEMENT_LOGIN_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public identityManagementLoginEnabled = false;
}
