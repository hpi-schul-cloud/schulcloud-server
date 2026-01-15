import { ConfigProperty, Configuration } from '@infra/configuration';
import { Transform } from 'class-transformer';
import { IsString } from 'class-validator';
import { Algorithm } from 'jsonwebtoken';
import { InternalJwtAuthGuardConfig } from '../interface';

export const JWT_AUTH_GUARD_CONFIG_TOKEN = 'JWT_AUTH_GUARD_CONFIG_TOKEN';

@Configuration()
export class JwtAuthGuardConfig implements InternalJwtAuthGuardConfig {
	@ConfigProperty('JWT_PUBLIC_KEY')
	@IsString()
	@Transform(({ value }: { value: string }) => value.replace(/\\n/g, '\n'))
	public jwtPublicKey!: string;

	@ConfigProperty('JWT_SIGNING_ALGORITHM')
	@IsString()
	public jwtSigningAlgorithm: Algorithm = 'RS256';

	@ConfigProperty('SC_DOMAIN')
	@IsString()
	public scDomain!: string;
}
