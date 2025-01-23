import { LoggerModule } from '@core/logger';
import { AuthorizationModule } from '@modules/authorization';
import { Module } from '@nestjs/common';
import { UserRepo } from '@shared/repo/user';
import { AccountModule } from './account.module';
import { AccountController } from './api/account.controller';
import { AccountUc } from './api/account.uc';

@Module({
	imports: [AccountModule, LoggerModule, AuthorizationModule],
	providers: [UserRepo, AccountUc],
	controllers: [AccountController],
	exports: [],
})
export class AccountApiModule {}
