import { Module } from '@nestjs/common';
import { PermissionService } from '@shared/domain';
import { AccountRepo, SystemRepo, UserRepo } from '@shared/repo';
import { IdentityManagementModule } from '@shared/infra/identity-management';
import { AccountController } from './controller/account.controller';
import { AccountService } from './services/account.service';
import { AccountValidationService } from './services/account.validation.service';
import { AccountUc } from './uc/account.uc';
import { LoggerModule } from '../../core/logger/logger.module';

@Module({
	imports: [IdentityManagementModule, LoggerModule],
	providers: [
		UserRepo,
		AccountRepo,
		SystemRepo,
		AccountService,
		AccountUc,
		PermissionService,
		AccountValidationService,
	],
	controllers: [AccountController],
	exports: [AccountUc, AccountService, AccountValidationService],
})
export class AccountModule {}
