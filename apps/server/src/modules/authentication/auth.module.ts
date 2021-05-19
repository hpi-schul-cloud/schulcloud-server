import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { UsersModule } from '../user/users.module';
import { JwtStrategy } from './strategy/jwt.strategy';
// import { AuthController } from './controller/auth.controller';
// import { LocalStrategy } from './strategy/local.strategy';

@Module({
	imports: [
		UsersModule,
		PassportModule,
		JwtModule.register({
			secret: jwtConstants.secret,
			signOptions: { expiresIn: '60s' },
		}),
	],
	providers: [AuthService, JwtStrategy],
	exports: [AuthService],
	controllers: [
		/*AuthController*/
	],
})
export class AuthModule {}
