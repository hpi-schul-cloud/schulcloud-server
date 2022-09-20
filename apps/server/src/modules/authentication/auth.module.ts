import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { RoleRepo, UserRepo } from '@shared/repo';
import { jwtConstants } from './constants';
import { JwtValidationAdapter } from './strategy/jwt-validation.adapter';
import { JwtStrategy } from './strategy/jwt.strategy';

@Module({
	imports: [PassportModule, JwtModule.register(jwtConstants)],
	providers: [JwtStrategy, JwtValidationAdapter, UserRepo, RoleRepo],
	controllers: [],
	exports: [],
})
export class AuthModule {}
