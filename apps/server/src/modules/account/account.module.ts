import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRepo } from '@shared/repo';
import { IdentityManagementModule } from '@shared/infra/identity-management';
import { LoggerModule } from '@src/core/logger/logger.module';
import { AccountRepo } from './repo';
import {
	AccountService,
	AccountValidationService,
	AccountServiceDb,
	AccountServiceIdm,
	AccountLookupService,
} from './services';
import { AccountIdmToDtoMapper, AccountIdmToDtoMapperDb, AccountIdmToDtoMapperIdm } from './mapper';
import { IAccountConfig } from './account-config';

function accountIdmToDtoMapperFactory(configService: ConfigService<IAccountConfig, true>): AccountIdmToDtoMapper {
	if (configService.get<boolean>('FEATURE_IDENTITY_MANAGEMENT_LOGIN_ENABLED') === true) {
		return new AccountIdmToDtoMapperIdm();
	}
	return new AccountIdmToDtoMapperDb();
}

@Module({
	imports: [IdentityManagementModule, LoggerModule],
	providers: [
		UserRepo,
		AccountRepo,
		{
			provide: AccountIdmToDtoMapper,
			useFactory: accountIdmToDtoMapperFactory,
			inject: [ConfigService],
		},
		AccountValidationService,
		AccountLookupService,
		// AccountServiceDb,
		AccountServiceIdm,
		// AccountService,
	],
	exports: [
		// AccountService,
		AccountValidationService,
	],
})
export class AccountModule {}
