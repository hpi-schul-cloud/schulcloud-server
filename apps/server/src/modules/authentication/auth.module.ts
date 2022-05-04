import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PermissionService } from '@shared/domain';
import { AccountRepo, UserRepo } from '@shared/repo';
import { jwtConstants } from './constants';
import { AccountController } from './controller/account.controller';
import { JwtValidationAdapter } from './strategy/jwt-validation.adapter';
import { JwtStrategy } from './strategy/jwt.strategy';
import { AccountUc } from './uc/account.uc';

@Module({
	imports: [PassportModule, JwtModule.register(jwtConstants)],
	providers: [JwtStrategy, JwtValidationAdapter, UserRepo, AccountRepo, AccountUc, PermissionService],
	controllers: [AccountController],
	exports: [AccountUc],
})
export class AuthModule {}
