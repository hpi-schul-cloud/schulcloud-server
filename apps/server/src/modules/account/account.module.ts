import { IdentityManagementModule } from '@infra/identity-management';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LegacySystemRepo, UserRepo } from '@shared/repo';

import { CqrsModule } from '@nestjs/cqrs';
import { LoggerModule } from '@src/core/logger/logger.module';
import { AccountConfig } from './account-config';
import { AccountRepo } from './repo/micro-orm/account.repo';
import { AccountIdmToDoMapper, AccountIdmToDoMapperDb, AccountIdmToDoMapperIdm } from './repo/micro-orm/mapper';
import { AccountServiceDb } from './domain/services/account-db.service';
import { AccountServiceIdm } from './domain/services/account-idm.service';
import { AccountService } from './domain/services/account.service';
import { AccountValidationService } from './domain/services/account.validation.service';

function accountIdmToDtoMapperFactory(configService: ConfigService<AccountConfig, true>): AccountIdmToDoMapper {
	if (configService.get<boolean>('FEATURE_IDENTITY_MANAGEMENT_LOGIN_ENABLED') === true) {
		return new AccountIdmToDoMapperIdm();
	}
	return new AccountIdmToDoMapperDb();
}

@Module({
	imports: [CqrsModule, IdentityManagementModule, LoggerModule],
	providers: [
		UserRepo,
		LegacySystemRepo,
		AccountRepo,
		AccountServiceDb,
		AccountServiceIdm,
		AccountService,
		AccountValidationService,
		{
			provide: AccountIdmToDoMapper,
			useFactory: accountIdmToDtoMapperFactory,
			inject: [ConfigService],
		},
	],
	exports: [AccountService, AccountValidationService],
})
export class AccountModule {}
