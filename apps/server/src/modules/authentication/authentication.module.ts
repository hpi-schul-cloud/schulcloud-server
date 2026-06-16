import { LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { EncryptionModule } from '@infra/encryption';
import { JwtWhitelistModule } from '@infra/jwt-whitelist';
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
import { AUTHENTICATION_ENCRYPTION_CONFIG_TOKEN, AuthenticationEncryptionConfig } from './encryption.config';
import { Oauth2ContextHelper } from './helper/oauth2-context.helper';
import { JWT_STRATEGY_CONFIG_TOKEN, JwtModuleConfig } from './jwt-module.config';
import { LogoutService, SessionService } from './services';
import { AuthenticationService } from './services/authentication.service';
import { LdapService } from './services/ldap.service';
import { ErwinStrategy } from './strategy/erwin.strategy';
import { LdapStrategy } from './strategy/ldap.strategy';
import { LocalStrategy } from './strategy/local.strategy';
import { Oauth2Strategy } from './strategy/oauth2.strategy';

const createJwtOptions = (config: JwtModuleConfig): JwtModuleOptions => {
	const { algorithm, expiresIn, scDomain, privateKey, publicKey } = config;
	const signOptions: SignOptions = {
		algorithm,
		expiresIn: expiresIn as SignOptions['expiresIn'],
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

	return options as JwtModuleOptions;
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
		JwtWhitelistModule.register(),
		UserModule,
		HttpModule,
		EncryptionModule.register(AUTHENTICATION_ENCRYPTION_CONFIG_TOKEN, AuthenticationEncryptionConfig),
	],
	providers: [
		LegacySchoolRepo,
		LocalStrategy,
		AuthenticationService,
		LdapService,
		LdapStrategy,
		Oauth2Strategy,
		Oauth2ContextHelper,
		LogoutService,
		ErwinStrategy,
		SessionService,
	],
	exports: [AuthenticationService, LogoutService, SessionService],
})
export class AuthenticationModule {}
