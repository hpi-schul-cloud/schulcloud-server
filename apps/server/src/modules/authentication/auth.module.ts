import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategy/jwt.strategy';
import { jwtConstants } from './constants';
import { UserModule } from '../user';
import { LegacyJwtAuthenticationAdapter } from './strategy/legacy-jwt-authentication.adapter';

@Module({
	imports: [PassportModule, JwtModule.register(jwtConstants), UserModule],
	providers: [JwtStrategy, LegacyJwtAuthenticationAdapter],
})
export class AuthModule {}
