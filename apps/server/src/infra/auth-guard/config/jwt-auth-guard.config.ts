import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToJwtSecretKey } from '@shared/controller/transformer';
import { IsString } from 'class-validator';
import { Algorithm } from 'jsonwebtoken';
import { InternalJwtAuthGuardConfig } from '../interface';

export const JWT_AUTH_GUARD_CONFIG_TOKEN = 'JWT_AUTH_GUARD_CONFIG_TOKEN';

/**
 * This is default Configuration for the JWT auth guard.
 * if you need to read values from different env variables, create your own config class
 * implementing InternalJwtAuthGuardConfig and provide it via the AuthGuardModule.register method.
 */
@Configuration()
export class JwtAuthGuardConfig implements InternalJwtAuthGuardConfig {
	@ConfigProperty('JWT_PUBLIC_KEY')
	@IsString()
	@StringToJwtSecretKey()
	public jwtPublicKey!: string;

	@ConfigProperty('JWT_SIGNING_ALGORITHM')
	@IsString()
	public jwtSigningAlgorithm: Algorithm = 'RS256';

	@ConfigProperty('SC_DOMAIN')
	@IsString()
	public scDomain!: string;
}
