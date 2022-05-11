import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '@src/modules/user';
import { AccountRepo, SystemRepo, UserRepo } from '@shared/repo';
import { PermissionService } from '@shared/domain';
import { JwtStrategy } from './strategy/jwt.strategy';
import { jwtConstants } from './constants';
import { JwtValidationAdapter } from './strategy/jwt-validation.adapter';
import { AccountUc } from './uc/account.uc';
import { AccountController } from './controller/account.controller';
import { AccountService } from './services/account.service';

@Module({
	imports: [PassportModule, JwtModule.register(jwtConstants), UserModule],
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
