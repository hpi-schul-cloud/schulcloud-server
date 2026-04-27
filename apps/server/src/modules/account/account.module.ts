import { LoggerModule } from '@core/logger/logger.module';
import { SagaModule } from '@modules/saga';
import { SystemModule } from '@modules/system';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { ACCOUNT_REPO } from './domain';
import { AccountServiceDb } from './domain/services/account-db.service';
import { AccountService } from './domain/services/account.service';
import { AccountMikroOrmRepo } from './repo';
import { DeleteUserAccountDataStep } from './saga';

@Module({
	imports: [SystemModule, LoggerModule, UserModule, SagaModule],
	providers: [
		{ provide: ACCOUNT_REPO, useClass: AccountMikroOrmRepo },
		AccountServiceDb,
		AccountService,
		DeleteUserAccountDataStep,
	],
	exports: [AccountService],
})
export class AccountModule {}
