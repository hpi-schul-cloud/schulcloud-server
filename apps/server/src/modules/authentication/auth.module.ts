import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { UserRepo } from '@shared/repo';
import { JwtStrategy } from './strategy/jwt.strategy';
import { jwtConstants } from './constants';
import { JwtValidationAdapter } from './strategy/jwt-validation.adapter';

@Module({
	imports: [PassportModule, JwtModule.register(jwtConstants)],
	providers: [JwtStrategy, JwtValidationAdapter, UserRepo],
	controllers: [],
	exports: [],
})
export class AuthModule {}
