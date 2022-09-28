import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PermissionService } from '@shared/domain';
import { AccountRepo, SystemRepo, UserRepo } from '@shared/repo';
import { AccountController } from './controller/account.controller';
import { AccountService } from './services/account.service';
import { AccountValidationService } from './services/account.validation.service';
import { AccountUc } from './uc/account.uc';

@Module({
	imports: [],
	providers: [
		UserRepo,
		AccountRepo,
		SystemRepo,
		AccountService,
		AccountUc,
		PermissionService,
		AccountValidationService,
		ConfigService,
	],
	controllers: [AccountController],
	exports: [AccountUc, AccountService, AccountValidationService],
})
export class AccountModule {}
