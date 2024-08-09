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
import { jwtConstants } from '@src/imports-from-feathers';
import { Algorithm, SignOptions } from 'jsonwebtoken';
import { AuthenticationService } from './services/authentication.service';
import { LdapService } from './services/ldap.service';
import { LdapStrategy } from './strategy/ldap.strategy';
import { LocalStrategy } from './strategy/local.strategy';
import { Oauth2Strategy } from './strategy/oauth2.strategy';

// values copied from Algorithm definition. Type does not exist at runtime and can't be checked anymore otherwise
const algorithms = [
	'HS256',
	'HS384',
	'HS512',
	'RS256',
	'RS384',
	'RS512',
	'ES256',
	'ES384',
	'ES512',
	'PS256',
	'PS384',
	'PS512',
	'none',
];

if (!algorithms.includes(jwtConstants.jwtOptions.algorithm)) {
	throw new Error(`${jwtConstants.jwtOptions.algorithm} is not a valid JWT signing algorithm`);
}
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
	],
	exports: [AuthenticationService],
})
export class AuthenticationModule {}
