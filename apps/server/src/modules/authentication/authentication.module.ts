import { AuthGuardModule } from '@infra/auth-guard';
import { CacheWrapperModule } from '@infra/cache';
import { IdentityManagementModule } from '@infra/identity-management';
import { AccountModule } from '@modules/account';
import { OauthModule } from '@modules/oauth/oauth.module';
import { RoleModule } from '@modules/role';
import { SystemModule } from '@modules/system';
import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LegacySchoolRepo, UserRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { authConfig } from '@src/infra/auth-guard/auth-config';
import { SignOptions } from 'jsonwebtoken';
import { JwtWhitelistAdapter } from './helper/jwt-whitelist.adapter';
import { AuthenticationService } from './services/authentication.service';
import { LdapService } from './services/ldap.service';
import { LdapStrategy } from './strategy/ldap.strategy';
import { LocalStrategy } from './strategy/local.strategy';
import { Oauth2Strategy } from './strategy/oauth2.strategy';

const { algorithm, audience, expiresIn, issuer, header } = authConfig.jwtOptions;
const signOptions: SignOptions = {
	algorithm,
	audience,
	expiresIn,
	issuer,
	header: { ...header, alg: algorithm },
};
const jwtModuleOptions: JwtModuleOptions = {
	secret: authConfig.secret,
	signOptions,
	verifyOptions: signOptions,
};
@Module({
	imports: [
		LoggerModule,
		PassportModule,
		JwtModule.register(jwtModuleOptions),
		AccountModule,
		SystemModule,
		OauthModule,
		RoleModule,
		IdentityManagementModule,
		CacheWrapperModule,
		AuthGuardModule,
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
	],
	exports: [AuthenticationService],
})
export class AuthenticationModule {}
