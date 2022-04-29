import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '@src/modules/user';
import { SystemRepo, UserRepo } from '@shared/repo';
import { PermissionService } from '@shared/domain';
import { JwtStrategy } from './strategy/jwt.strategy';
import { jwtConstants } from './constants';
import { JwtValidationAdapter } from './strategy/jwt-validation.adapter';
import { AccountUc } from './uc/account.uc';
import { AccountController } from './controller/account.controller';
import { AccountModule } from '../account/account.module';

@Module({
	imports: [PassportModule, JwtModule.register(jwtConstants), UserModule, AccountModule],
	providers: [JwtStrategy, JwtValidationAdapter, UserRepo, SystemRepo, AccountUc, PermissionService],
	controllers: [AccountController],
	exports: [AccountUc],
})
export class AuthModule {}
