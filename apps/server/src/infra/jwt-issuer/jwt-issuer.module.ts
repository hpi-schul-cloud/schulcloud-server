import { ConfigurationModule } from '@infra/configuration';
import { JwtWhitelistModule } from '@infra/jwt-whitelist';
import { Module } from '@nestjs/common';
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';
import { type SignOptions } from 'jsonwebtoken';
import { JWT_ISSUER_CONFIG_TOKEN, JwtIssuerConfig } from './jwt-issuer.config';
import { JwtIssuerService } from './jwt-issuer.service';

const createJwtOptions = (config: JwtIssuerConfig): JwtModuleOptions => {
	const { algorithm, expiresIn, scDomain, privateKey, publicKey } = config;
	const signOptions: SignOptions = {
		algorithm,
		expiresIn: expiresIn as SignOptions['expiresIn'],
		issuer: scDomain,
		audience: scDomain,
		header: { typ: 'JWT', alg: algorithm },
	};

	const options: JwtModuleOptions = {
		privateKey,
		publicKey,
		signOptions,
	};

	return options;
};

@Module({
	imports: [
		JwtModule.registerAsync({
			useFactory: createJwtOptions,
			inject: [JWT_ISSUER_CONFIG_TOKEN],
			imports: [ConfigurationModule.register(JWT_ISSUER_CONFIG_TOKEN, JwtIssuerConfig)],
		}),
		JwtWhitelistModule.register(),
	],
	providers: [JwtIssuerService],
	exports: [JwtIssuerService],
})
export class JwtIssuerModule {}
