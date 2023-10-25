import { Module } from '@nestjs/common';
import { UserRepo } from '@shared/repo';
import { AccountModule } from './account.module';
import { AccountController } from './controller/account.controller';
import { AccountUc } from './uc/account.uc';
import { LoggerModule } from '../../core/logger/logger.module';

@Module({
	imports: [AccountModule, LoggerModule],
	providers: [UserRepo, AccountUc],
	controllers: [AccountController],
	exports: [],
})
export class AccountApiModule {}
