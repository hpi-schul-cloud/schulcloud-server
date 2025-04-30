import { LoggerModule } from '@core/logger';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { AuthGuardModule, AuthGuardOptions } from '@infra/auth-guard';
import { EncryptionModule } from '@infra/encryption';
import { IdentityManagementModule } from '@infra/identity-management';
import { AccountModule } from '@modules/account';
import { LegacySchoolRepo } from '@modules/legacy-school/repo';
import { OauthModule } from '@modules/oauth/oauth.module';
import { RoleModule } from '@modules/role';
import { SystemModule } from '@modules/system';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Algorithm, SignOptions } from 'jsonwebtoken';
import { UserModule } from '../user';
import { JwtWhitelistAdapter } from './helper/jwt-whitelist.adapter';
import { LogoutService } from './services';
import { AuthenticationService } from './services/authentication.service';
import { LdapService } from './services/ldap.service';
import { LdapStrategy } from './strategy/ldap.strategy';
import { LocalStrategy } from './strategy/local.strategy';
import { Oauth2Strategy } from './strategy/oauth2.strategy';

const createJwtOptions = () => {
	const algorithm = Configuration.get('JWT_SIGNING_ALGORITHM') as Algorithm;

	const signOptions: SignOptions = {
		algorithm,
		expiresIn: Configuration.get('JWT_LIFETIME') as string,
		issuer: Configuration.get('SC_DOMAIN') as string,
		audience: Configuration.get('SC_DOMAIN') as string,
		header: { typ: 'JWT', alg: algorithm },
	};

	const privateKey = Configuration.get('JWT_PRIVATE_KEY') as string;
	const publicKey = Configuration.get('JWT_PUBLIC_KEY') as string;

	const options = {
		privateKey,
		publicKey,
		signOptions,
		verifyOptions: signOptions,
	};

	return options;
};

// This module is for use by the AuthenticationApiTestModule, i.e. for use in api tests of other apps than the core server.
// In those tests the configService can't be used, because the core server's config is not available.
@Module({
	imports: [
		LoggerModule,
		PassportModule,
		JwtModule.registerAsync({
			useFactory: createJwtOptions,
		}),
		AccountModule,
		SystemModule,
		OauthModule,
		RoleModule,
		IdentityManagementModule,
		AuthGuardModule.register([AuthGuardOptions.JWT]),
		UserModule,
		HttpModule,
		EncryptionModule,
		UserModule,
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
export class AuthenticationTestModule {}
