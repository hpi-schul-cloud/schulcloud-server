import { ConfigProperty, Configuration } from '@infra/configuration';
import { Transform } from 'class-transformer';
import { IsString } from 'class-validator';
import { Algorithm } from 'jsonwebtoken';

export const JWT_STRATEGY_CONFIG_TOKEN = 'JWT_STRATEGY_CONFIG_TOKEN';

@Configuration()
export class JwtModuleConfig {
	@ConfigProperty('JWT_PRIVATE_KEY')
	@IsString()
	@Transform(({ value }: { value: string }) => value.replace(/\\n/g, '\n'))
	public privateKey!: string;

	@ConfigProperty('JWT_PUBLIC_KEY')
	@IsString()
	@Transform(({ value }: { value: string }) => value.replace(/\\n/g, '\n'))
	public publicKey!: string;

	@ConfigProperty('JWT_SIGNING_ALGORITHM')
	@IsString()
	public algorithm: Algorithm = 'RS256';

	@ConfigProperty('JWT_LIFETIME')
	@IsString()
	public expiresIn = '30d';

	@ConfigProperty('SC_DOMAIN')
	@IsString()
	public scDomain!: string;
}
