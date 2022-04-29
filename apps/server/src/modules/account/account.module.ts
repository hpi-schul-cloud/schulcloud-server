import { Module } from '@nestjs/common';
import { AccountRepo, SystemRepo, UserRepo } from '@shared/repo';
import { AccountService } from './services/account.service';

@Module({
	imports: [],
	providers: [UserRepo, AccountRepo, SystemRepo, AccountService],
	controllers: [],
	exports: [AccountService],
})
export class AccountModule {}
