import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PermissionService } from '@shared/domain';
import { AccountRepo, SystemRepo, UserRepo } from '@shared/repo';
import { jwtConstants } from './constants';
import { AccountController } from './controller/account.controller';
import { AccountService } from './services/account.service';
import { JwtValidationAdapter } from './strategy/jwt-validation.adapter';
import { JwtStrategy } from './strategy/jwt.strategy';
import { AccountUc } from './uc/account.uc';

@Module({
	imports: [PassportModule, JwtModule.register(jwtConstants)],
	providers: [
		JwtStrategy,
		JwtValidationAdapter,
		UserRepo,
		AccountRepo,
		SystemRepo,
		AccountUc,
		AccountService,
		PermissionService,
	],
	controllers: [AccountController],
	exports: [AccountUc],
})
export class AuthModule {}
