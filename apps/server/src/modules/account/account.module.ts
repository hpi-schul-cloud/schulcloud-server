import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PermissionService } from '@shared/domain';
import { SystemRepo, UserRepo } from '@shared/repo';
import { IdentityManagementModule } from '@shared/infra/identity-management';
import { LoggerModule } from '@src/core/logger/logger.module';
import { AccountRepo } from './repo/account.repo';
import { AccountService } from './services/account.service';
import { AccountValidationService } from './services/account.validation.service';
import { AccountServiceDb } from './services/account-db.service';
import { AccountServiceIdm } from './services/account-idm.service';
import { AccountIdmToDtoMapper, AccountIdmToDtoMapperLegacy, AccountIdmToDtoMapperNew } from './mapper';
import { IServerConfig } from '../server/server.config';
import { AccountLookupService } from './services/account-lookup.service';

function accountIdmToDtoMapperFactory(configService: ConfigService<IServerConfig, true>): AccountIdmToDtoMapper {
	if (configService.get<boolean>('FEATURE_IDENTITY_MANAGEMENT_LOGIN_ENABLED') === true) {
		return new AccountIdmToDtoMapperNew();
	}
	return new AccountIdmToDtoMapperLegacy();
}

@Module({
	imports: [IdentityManagementModule, LoggerModule],
	providers: [
		UserRepo,
		SystemRepo,
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
