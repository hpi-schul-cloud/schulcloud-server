import { LoggerModule } from '@infra/logger';
import { SagaModule } from '@modules/saga';
import { SystemModule } from '@modules/system';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { ACCOUNT_REPO } from './domain';
import { AccountService } from './domain/services/account.service';
import { AccountMikroOrmRepo } from './repo';
import { DeleteUserAccountDataStep } from './saga';

@Module({
	imports: [SystemModule, LoggerModule, UserModule, SagaModule],
	providers: [{ provide: ACCOUNT_REPO, useClass: AccountMikroOrmRepo }, AccountService, DeleteUserAccountDataStep],
	exports: [AccountService],
})
export class AccountModule {}
