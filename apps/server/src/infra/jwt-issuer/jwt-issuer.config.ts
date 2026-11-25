import { ConfigProperty, Configuration, Secret } from '@infra/configuration';
import { Transform } from 'class-transformer';
import { IsString } from 'class-validator';
import { type Algorithm } from 'jsonwebtoken';

export const JWT_ISSUER_CONFIG_TOKEN = 'JWT_ISSUER_CONFIG_TOKEN';

@Configuration()
export class JwtIssuerConfig {
	@ConfigProperty('JWT_PRIVATE_KEY')
	@Secret()
	@IsString()
	@Transform(({ value }: { value: string }) => value.replace(/\\n/g, '\n'))
	public privateKey!: string;

	@ConfigProperty('JWT_SIGNING_ALGORITHM')
	@IsString()
	public algorithm: Algorithm = 'RS256';

	@ConfigProperty('SC_DOMAIN')
	@IsString()
	public scDomain!: string;
}
