import { LoggerModule } from '@core/logger/logger.module';
import { ConfigurationModule } from '@infra/configuration';
import {
	IDENTITY_MANAGEMENT_CONFIG_TOKEN,
	IdentityManagementConfig,
	IdentityManagementModule,
	KEYCLOAK_ADMINISTRATION_CONFIG_TOKEN,
	KeycloakAdministrationConfig,
} from '@infra/identity-management';
import { SagaModule } from '@modules/saga';
import { SystemModule } from '@modules/system';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { ACCOUNT_CONFIG_TOKEN, AccountConfig } from './account-config';
import { ACCOUNT_REPO, AccountIdmToDoMapper, AccountIdmToDoMapperDb, AccountIdmToDoMapperIdm } from './domain';
import { AccountServiceDb } from './domain/services/account-db.service';
import { AccountServiceIdm } from './domain/services/account-idm.service';
import { AccountService } from './domain/services/account.service';
import { ACCOUNT_ENCRYPTION_CONFIG_TOKEN, AccountEncryptionConfig } from './encryption.config';
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
		IdentityManagementModule.register({
			encryptionConfig: { Constructor: AccountEncryptionConfig, injectionToken: ACCOUNT_ENCRYPTION_CONFIG_TOKEN },
			identityManagementConfig: {
				Constructor: IdentityManagementConfig,
				injectionToken: IDENTITY_MANAGEMENT_CONFIG_TOKEN,
			},
			keycloakAdministrationConfig: {
				Constructor: KeycloakAdministrationConfig,
				injectionToken: KEYCLOAK_ADMINISTRATION_CONFIG_TOKEN,
			},
		}),
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
