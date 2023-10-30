import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PermissionService } from '@shared/domain/service/permission.service';
import { IdentityManagementModule } from '@shared/infra/identity-management/identity-management.module';
import { SystemRepo } from '@shared/repo/system/system.repo';
import { UserRepo } from '@shared/repo/user/user.repo';
import { LoggerModule } from '@src/core/logger/logger.module';
import { IServerConfig } from '../server/server.config';
import { AccountIdmToDtoMapper } from './mapper/account-idm-to-dto.mapper.abstract';
import { AccountIdmToDtoMapperDb } from './mapper/account-idm-to-dto.mapper.db';
import { AccountIdmToDtoMapperIdm } from './mapper/account-idm-to-dto.mapper.idm';
import { AccountRepo } from './repo/account.repo';
import { AccountServiceDb } from './services/account-db.service';
import { AccountServiceIdm } from './services/account-idm.service';
import { AccountLookupService } from './services/account-lookup.service';
import { AccountService } from './services/account.service';
import { AccountValidationService } from './services/account.validation.service';

function accountIdmToDtoMapperFactory(configService: ConfigService<IServerConfig, true>): AccountIdmToDtoMapper {
	if (configService.get<boolean>('FEATURE_IDENTITY_MANAGEMENT_LOGIN_ENABLED') === true) {
		return new AccountIdmToDtoMapperIdm();
	}
	return new AccountIdmToDtoMapperDb();
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
