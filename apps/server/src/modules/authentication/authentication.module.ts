import { CacheWrapperModule } from '@infra/cache';
import { IdentityManagementModule } from '@infra/identity-management';
import { AccountModule } from '@modules/account';
import { OauthModule } from '@modules/oauth/oauth.module';
import { RoleModule } from '@modules/role';
import { SystemModule } from '@modules/system';
import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LegacySchoolRepo, LegacySystemRepo, UserRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { Algorithm, SignOptions } from 'jsonwebtoken';
import { jwtConstants } from './constants';
import { AuthenticationService } from './services/authentication.service';
import { LdapService } from './services/ldap.service';
import { JwtValidationAdapter } from './helper/jwt-validation.adapter';
import { JwtStrategy } from './strategy/jwt.strategy';
import { LdapStrategy } from './strategy/ldap.strategy';
import { LocalStrategy } from './strategy/local.strategy';
import { Oauth2Strategy } from './strategy/oauth2.strategy';
import { XApiKeyStrategy } from './strategy/x-api-key.strategy';
import { WsJwtStrategy } from './strategy/ws-jwt.strategy';

const signAlgorithm = jwtConstants.jwtOptions.algorithm as Algorithm;

const signOptions: SignOptions = {
	algorithm: signAlgorithm,
	audience: jwtConstants.jwtOptions.audience,
	expiresIn: jwtConstants.jwtOptions.expiresIn,
	issuer: jwtConstants.jwtOptions.issuer,
	header: { ...jwtConstants.jwtOptions.header, alg: signAlgorithm },
};
const jwtModuleOptions: JwtModuleOptions = {
	secret: jwtConstants.secret,
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
	],
	providers: [
		JwtStrategy,
		WsJwtStrategy,
		JwtValidationAdapter,
		UserRepo,
		LegacySystemRepo,
		LegacySchoolRepo,
		LocalStrategy,
		AuthenticationService,
		LdapService,
		LdapStrategy,
		Oauth2Strategy,
		XApiKeyStrategy,
	],
	exports: [AuthenticationService],
})
export class AuthenticationModule {}
