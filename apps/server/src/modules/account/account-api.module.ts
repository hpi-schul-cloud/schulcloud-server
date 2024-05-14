import { AuthorizationModule } from '@modules/authorization';
import { Module } from '@nestjs/common';
import { UserRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { AccountUc } from './api/account.uc';
import { AccountModule } from './account.module';
import { AccountController } from './api/account.controller';

@Module({
	imports: [AccountModule, LoggerModule, AuthorizationModule],
	providers: [UserRepo, AccountUc],
	controllers: [AccountController],
	exports: [],
})
export class AccountApiModule {}
