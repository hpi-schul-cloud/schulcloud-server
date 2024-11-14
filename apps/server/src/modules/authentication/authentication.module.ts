import { CacheWrapperModule } from '@infra/cache';
import { EncryptionModule } from '@infra/encryption';
import { IdentityManagementModule } from '@infra/identity-management';
import { AccountModule } from '@modules/account';
import { OauthModule } from '@modules/oauth/oauth.module';
import { RoleModule } from '@modules/role';
import { SystemModule } from '@modules/system';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LegacySchoolRepo, UserRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { Algorithm, SignOptions } from 'jsonwebtoken';
import { AuthenticationConfig } from './authentication-config';
import { JwtWhitelistAdapter } from './helper/jwt-whitelist.adapter';
import { LogoutService } from './services';
import { AuthenticationService } from './services/authentication.service';
import { LdapService } from './services/ldap.service';
import { LdapStrategy } from './strategy/ldap.strategy';
import { LocalStrategy } from './strategy/local.strategy';
import { Oauth2Strategy } from './strategy/oauth2.strategy';

const createJwtOptions = (configService: ConfigService<AuthenticationConfig>) => {
	const algorithm = configService.getOrThrow<Algorithm>('JWT_SIGNING_ALGORITHM');

	const signOptions: SignOptions = {
		algorithm,
		expiresIn: configService.getOrThrow<string>('JWT_LIFETIME'),
		issuer: configService.getOrThrow<string>('SC_DOMAIN'),
		audience: configService.getOrThrow<string>('SC_DOMAIN'),
		header: { typ: 'JWT', alg: algorithm },
	};

	const privateKey = configService.getOrThrow<string>('JWT_PRIVATE_KEY');
	const publicKey = configService.getOrThrow<string>('JWT_PUBLIC_KEY');

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
		PassportModule,
		JwtModule.registerAsync({
			useFactory: createJwtOptions,
			inject: [ConfigService],
		}),
		AccountModule,
		SystemModule,
		OauthModule,
		RoleModule,
		IdentityManagementModule,
		CacheWrapperModule,
		UserModule,
		HttpModule,
		EncryptionModule,
	],
	providers: [
		UserRepo,
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
