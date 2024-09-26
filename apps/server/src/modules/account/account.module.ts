import { IdentityManagementModule } from '@infra/identity-management';
import { SystemModule } from '@modules/system';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { UserRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger/logger.module';
import { AccountConfig } from './account-config';
import { AccountServiceDb } from './domain/services/account-db.service';
import { AccountServiceIdm } from './domain/services/account-idm.service';
import { AccountService } from './domain/services/account.service';
import { AccountRepo } from './repo/micro-orm/account.repo';
import { AccountIdmToDoMapper, AccountIdmToDoMapperDb, AccountIdmToDoMapperIdm } from './repo/micro-orm/mapper';

function accountIdmToDtoMapperFactory(configService: ConfigService<AccountConfig, true>): AccountIdmToDoMapper {
	if (configService.get<boolean>('FEATURE_IDENTITY_MANAGEMENT_LOGIN_ENABLED') === true) {
		return new AccountIdmToDoMapperIdm();
	}
	return new AccountIdmToDoMapperDb();
}

@Module({
	imports: [CqrsModule, IdentityManagementModule, SystemModule, LoggerModule],
	providers: [
		UserRepo, // should not be added as provider
		AccountRepo,
		AccountServiceDb,
		AccountServiceIdm,
		AccountService,
		{
			provide: AccountIdmToDoMapper,
			useFactory: accountIdmToDtoMapperFactory,
			inject: [ConfigService],
		},
	],
	exports: [AccountService],
})
export class AccountModule {}
