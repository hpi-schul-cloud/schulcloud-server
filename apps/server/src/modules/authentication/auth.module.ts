import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategy/jwt.strategy';
import { jwtConstants } from './constants';
import { UserModule } from '../user';
// import { AuthController } from './controller/auth.controller';
// import { LocalStrategy } from './strategy/local.strategy';
import { RedisModule } from './redis/redis.module';
import { JwtValidationService } from './jwt-validation/jwt-validation.service';

@Module({
	imports: [PassportModule, JwtModule.register(jwtConstants), UserModule, RedisModule],
	providers: [JwtStrategy, JwtValidationService],
	exports: [],
	controllers: [
		/* AuthController */
	],
})
export class AuthModule {}
