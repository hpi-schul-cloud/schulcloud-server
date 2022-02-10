import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '@src/modules/user';
import { UserRepo } from '@shared/repo';
import { JwtStrategy } from './strategy/jwt.strategy';
import { jwtConstants } from './constants';
import { JwtValidationAdapter } from './strategy/jwt-validation.adapter';
import { AccountUc } from './uc/account.uc';
import { AccountRepo } from '@shared/repo/account';

@Module({
	imports: [PassportModule, JwtModule.register(jwtConstants), UserModule],
	providers: [JwtStrategy, JwtValidationAdapter, UserRepo, AccountRepo, AccountUc],
	exports: [AccountUc],
})
export class AuthModule {}
