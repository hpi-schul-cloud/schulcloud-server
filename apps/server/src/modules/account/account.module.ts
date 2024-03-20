import { IdentityManagementModule } from '@infra/identity-management';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PermissionService } from '@shared/domain/service';
import { LegacySystemRepo, UserRepo } from '@shared/repo';

import { LoggerModule } from '@src/core/logger/logger.module';
import { CqrsModule } from '@nestjs/cqrs';
import { ServerConfig } from '../server/server.config';
import { AccountIdmToDtoMapper, AccountIdmToDtoMapperDb, AccountIdmToDtoMapperIdm } from './mapper';
import { AccountRepo } from './repo/account.repo';
import { AccountServiceDb } from './services/account-db.service';
import { AccountServiceIdm } from './services/account-idm.service';
import { AccountLookupService } from './services/account-lookup.service';
import { AccountService } from './services/account.service';
import { AccountValidationService } from './services/account.validation.service';

function accountIdmToDtoMapperFactory(configService: ConfigService<ServerConfig, true>): AccountIdmToDtoMapper {
	if (configService.get<boolean>('FEATURE_IDENTITY_MANAGEMENT_LOGIN_ENABLED') === true) {
		return new AccountIdmToDtoMapperIdm();
	}
	return new AccountIdmToDtoMapperDb();
}

@Module({
	imports: [CqrsModule, IdentityManagementModule, LoggerModule],
	providers: [
		UserRepo,
		LegacySystemRepo,
		PermissionService,
		AccountRepo,
		AccountServiceDb,
		AccountServiceIdm,
		AccountService,
		AccountLookupService,
		AccountValidationService,
		{
			provide: AccountIdmToDtoMapper,
			useFactory: accountIdmToDtoMapperFactory,
			inject: [ConfigService],
		},
	],
	exports: [AccountService, AccountValidationService],
})
export class AccountModule {}
