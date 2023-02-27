import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { SchoolRepo, SystemRepo, UserRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { Algorithm, SignOptions } from 'jsonwebtoken';
import { IdentityManagementModule } from '@shared/infra/identity-management';
import { AccountModule } from '../account';
import { AuthenticationService } from './services/authentication.service';
import { jwtConstants } from './constants';
import { JwtValidationAdapter } from './strategy/jwt-validation.adapter';
import { JwtStrategy } from './strategy/jwt.strategy';
import { LdapStrategy } from './strategy/ldap.strategy';
import { LocalStrategy } from './strategy/local.strategy';
import { LdapService } from './services/ldap.service';
import { SystemModule } from '../system';
import { OauthModule } from '../oauth';
import { OauthStrategy } from './strategy/oauth.strategy';
import { SchoolMapper } from '../school/mapper/school.mapper';

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
		IdentityManagementModule,
	],
	providers: [
		JwtStrategy,
		JwtValidationAdapter,
		UserRepo,
		SystemRepo,
		SchoolRepo,
		SchoolMapper,
		LocalStrategy,
		AuthenticationService,
		LdapService,
		LdapStrategy,
		OauthStrategy,
	],
	exports: [AuthenticationService],
})
export class AuthenticationModule {}
