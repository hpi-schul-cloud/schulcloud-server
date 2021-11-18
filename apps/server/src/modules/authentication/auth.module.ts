import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '@src/modules/user';
import { JwtStrategy } from './strategy/jwt.strategy';
import { jwtConstants } from './constants';
import { JwtValidationAdapter } from './strategy/jwt-validation.adapter';

@Module({
	imports: [PassportModule, JwtModule.register(jwtConstants), UserModule],
	providers: [JwtStrategy, JwtValidationAdapter],
})
export class AuthModule {}
