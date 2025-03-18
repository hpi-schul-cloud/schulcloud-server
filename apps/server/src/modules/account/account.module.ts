import { LoggerModule } from '@core/logger/logger.module';
import { IdentityManagementModule } from '@infra/identity-management';
import { SystemModule } from '@modules/system';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { AccountConfig } from './account-config';
import { AccountServiceDb } from './domain/services/account-db.service';
import { AccountServiceIdm } from './domain/services/account-idm.service';
import { AccountService } from './domain/services/account.service';
import { AccountIdmToDoMapper, AccountIdmToDoMapperDb, AccountIdmToDoMapperIdm, AccountRepo } from './repo';

function accountIdmToDtoMapperFactory(configService: ConfigService<AccountConfig, true>): AccountIdmToDoMapper {
	if (configService.get<boolean>('FEATURE_IDENTITY_MANAGEMENT_LOGIN_ENABLED') === true) {
		return new AccountIdmToDoMapperIdm();
	}
	return new AccountIdmToDoMapperDb();
}

@Module({
	imports: [CqrsModule, IdentityManagementModule, SystemModule, LoggerModule, UserModule],
	providers: [
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
