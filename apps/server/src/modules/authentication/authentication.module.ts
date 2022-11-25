import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { SchoolRepo, SystemRepo, UserRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { Algorithm, SignOptions } from 'jsonwebtoken';
import { AccountModule } from '../account';
import { AuthenticationService } from './services/authentication.service';
import { jwtConstants } from './constants';
import { LoginController } from './controllers/login.controller';
import { JwtValidationAdapter } from './strategy/jwt-validation.adapter';
import { JwtStrategy } from './strategy/jwt.strategy';
import { LdapStrategy } from './strategy/ldap.strategy';
import { LocalStrategy } from './strategy/local.strategy';
import { LdapService } from './services/ldap.service';

const signAlgoritm = jwtConstants.jwtOptions.algorithm as Algorithm;
const signOptions: SignOptions = {
	algorithm: signAlgoritm,
	audience: jwtConstants.jwtOptions.audience,
	expiresIn: jwtConstants.jwtOptions.expiresIn,
	issuer: jwtConstants.jwtOptions.issuer,
	header: { ...jwtConstants.jwtOptions.header, alg: signAlgoritm },
};
const jwtModuleOptions: JwtModuleOptions = {
	secret: jwtConstants.secret,
	signOptions,
	verifyOptions: signOptions,
};
@Module({
	imports: [LoggerModule, PassportModule, JwtModule.register(jwtModuleOptions), AccountModule],
	providers: [
		JwtStrategy,
		JwtValidationAdapter,
		UserRepo,
		SystemRepo,
		SchoolRepo,
		LocalStrategy,
		AuthenticationService,
		LdapService,
		LdapStrategy,
	],
	exports: [AuthenticationService],
})
export class AuthenticationModule {}
