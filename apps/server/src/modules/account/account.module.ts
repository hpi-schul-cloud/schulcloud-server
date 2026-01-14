import { LoggerModule } from '@core/logger/logger.module';
import { ConfigurationModule } from '@infra/configuration';
import { IdentityManagementModule } from '@infra/identity-management';
import { SagaModule } from '@modules/saga';
import { SystemModule } from '@modules/system';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { ACCOUNT_CONFIG_TOKEN, AccountConfig } from './account-config';
import { ACCOUNT_REPO, AccountIdmToDoMapper, AccountIdmToDoMapperDb, AccountIdmToDoMapperIdm } from './domain';
import { AccountServiceDb } from './domain/services/account-db.service';
import { AccountServiceIdm } from './domain/services/account-idm.service';
import { AccountService } from './domain/services/account.service';
import { AccountEncryptionConfig } from './encryption.config';
import { AccountMikroOrmRepo } from './repo';
import { DeleteUserAccountDataStep } from './saga';

function accountIdmToDtoMapperFactory(config: AccountConfig): AccountIdmToDoMapper {
	if (config.identityManagementLoginEnabled === true) {
		return new AccountIdmToDoMapperIdm();
	}
	return new AccountIdmToDoMapperDb();
}

@Module({
	imports: [
		IdentityManagementModule.register(AccountEncryptionConfig),
		SystemModule,
		LoggerModule,
		UserModule,
		SagaModule,
		ConfigurationModule.register(ACCOUNT_CONFIG_TOKEN, AccountConfig),
	],
	providers: [
		{ provide: ACCOUNT_REPO, useClass: AccountMikroOrmRepo },
		AccountServiceDb,
		AccountServiceIdm,
		AccountService,
		{
			provide: AccountIdmToDoMapper,
			useFactory: accountIdmToDtoMapperFactory,
			inject: [ACCOUNT_CONFIG_TOKEN],
		},
		DeleteUserAccountDataStep,
	],
	exports: [AccountService],
})
export class AccountModule {}
