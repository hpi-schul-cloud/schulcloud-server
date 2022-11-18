import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UserRepo } from '@shared/repo';
import { Algorithm, SignOptions } from 'jsonwebtoken';
import { AccountModule } from '../account';
import { AuthenticationService } from './authentication.service';
import { jwtConstants } from './constants';
import { LoginController } from './controllers/login.controller';
import { JwtValidationAdapter } from './strategy/jwt-validation.adapter';
import { JwtStrategy } from './strategy/jwt.strategy';
import { LocalStrategy } from './strategy/local.strategy';

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
	imports: [PassportModule, JwtModule.register(jwtModuleOptions), AccountModule],
	providers: [JwtStrategy, JwtValidationAdapter, UserRepo, LocalStrategy, AuthenticationService],
	controllers: [LoginController],
	exports: [],
})
export class AuthModule {}
