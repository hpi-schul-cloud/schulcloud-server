import { LoggerModule } from '@core/logger/logger.module';
import { IdentityManagementModule } from '@infra/identity-management';
import { SystemModule } from '@modules/system';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { DeletionModule } from '@modules/deletion';
import { ConfigService } from '@nestjs/config';
import { AccountConfig } from './account-config';
import { ACCOUNT_REPO, AccountIdmToDoMapper, AccountIdmToDoMapperDb, AccountIdmToDoMapperIdm } from './domain';
import { AccountServiceDb } from './domain/services/account-db.service';
import { AccountServiceIdm } from './domain/services/account-idm.service';
import { AccountService } from './domain/services/account.service';
import { AccountMikroOrmRepo } from './repo';

function accountIdmToDtoMapperFactory(configService: ConfigService<AccountConfig, true>): AccountIdmToDoMapper {
	if (configService.get<boolean>('FEATURE_IDENTITY_MANAGEMENT_LOGIN_ENABLED') === true) {
		return new AccountIdmToDoMapperIdm();
	}
	return new AccountIdmToDoMapperDb();
}

@Module({
	imports: [IdentityManagementModule, SystemModule, LoggerModule, UserModule, DeletionModule],
	providers: [
		{ provide: ACCOUNT_REPO, useClass: AccountMikroOrmRepo },
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
