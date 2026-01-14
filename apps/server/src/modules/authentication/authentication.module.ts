import { LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { EncryptionModule } from '@infra/encryption';
import { IdentityManagementModule } from '@infra/identity-management';
import { ValkeyClientModule } from '@infra/valkey-client';
import { AccountModule } from '@modules/account';
import { LegacySchoolRepo } from '@modules/legacy-school/repo';
import { OauthModule } from '@modules/oauth/oauth.module';
import { RoleModule } from '@modules/role';
import { SystemModule } from '@modules/system';
import { UserModule } from '@modules/user';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { SignOptions } from 'jsonwebtoken';
import { AUTHENTICATION_CONFIG_TOKEN, AuthenticationConfig } from './authentication-config';
import { JwtWhitelistAdapter } from './helper/jwt-whitelist.adapter';
import { JWT_STRATEGY_CONFIG_TOKEN, JwtModuleConfig } from './jwt-module.config';
import { LogoutService } from './services';
import { AuthenticationService } from './services/authentication.service';
import { LdapService } from './services/ldap.service';
import { LdapStrategy } from './strategy/ldap.strategy';
import { LocalStrategy } from './strategy/local.strategy';
import { Oauth2Strategy } from './strategy/oauth2.strategy';
import { SESSION_VALKEY_CLIENT, ValkeyClientSessionConfig } from './valkey-client-session.config';

const createJwtOptions = (config: JwtModuleConfig): JwtModuleOptions => {
	const { algorithm, expiresIn, scDomain, privateKey, publicKey } = config;
	const signOptions: SignOptions = {
		algorithm,
		expiresIn,
		issuer: scDomain,
		audience: scDomain,
		header: { typ: 'JWT', alg: algorithm },
	};

	const options = {
		privateKey,
		publicKey,
		signOptions,
		verifyOptions: signOptions,
	};

	return options;
};

@Module({
	imports: [
		LoggerModule,
		ConfigurationModule.register(AUTHENTICATION_CONFIG_TOKEN, AuthenticationConfig),
		PassportModule,
		JwtModule.registerAsync({
			useFactory: createJwtOptions,
			inject: [JWT_STRATEGY_CONFIG_TOKEN],
			imports: [ConfigurationModule.register(JWT_STRATEGY_CONFIG_TOKEN, JwtModuleConfig)],
		}),
		AccountModule,
		SystemModule,
		OauthModule,
		RoleModule,
		IdentityManagementModule,
		ValkeyClientModule.register(SESSION_VALKEY_CLIENT, ValkeyClientSessionConfig),
		UserModule,
		HttpModule,
		EncryptionModule,
	],
	providers: [
		LegacySchoolRepo,
		LocalStrategy,
		AuthenticationService,
		LdapService,
		LdapStrategy,
		Oauth2Strategy,
		JwtWhitelistAdapter,
		LogoutService,
	],
	exports: [AuthenticationService, LogoutService],
})
export class AuthenticationModule {}
