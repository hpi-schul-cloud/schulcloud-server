import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthController } from './auth.controller';
import { jwtOptionsProvider } from './jwt-options.provider';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
	imports: [UsersModule, PassportModule, JwtModule],
	providers: [AuthService, LocalStrategy, JwtStrategy, jwtOptionsProvider],
	exports: [AuthService],
	controllers: [AuthController],
})
export class AuthModule {}
