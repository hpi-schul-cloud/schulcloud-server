import { ConfigurationModule } from '@infra/configuration';
import { JwtWhitelistModule } from '@infra/jwt-whitelist';
import { Module } from '@nestjs/common';
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';
import { type SignOptions } from 'jsonwebtoken';
import { JWT_ISSUER_CONFIG_TOKEN, JwtIssuerConfig } from './jwt-issuer.config';
import { JwtIssuerService } from './jwt-issuer.service';

const createJwtOptions = (config: JwtIssuerConfig): JwtModuleOptions => {
	const { algorithm, scDomain, privateKey } = config;
	const signOptions: SignOptions = {
		algorithm,
		issuer: scDomain,
		audience: scDomain,
		header: { typ: 'JWT', alg: algorithm },
	};

	const options: JwtModuleOptions = {
		privateKey,
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
	exports: [JwtIssuerService, JwtWhitelistModule],
})
export class JwtIssuerModule {}
