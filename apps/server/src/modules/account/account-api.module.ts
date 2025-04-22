import { LoggerModule } from '@core/logger';
import { AuthorizationModule } from '@modules/authorization';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { AccountModule } from './account.module';
import { AccountController } from './api/account.controller';
import { AccountUc } from './api/account.uc';
import { DeletionModule } from '@modules/deletion';

@Module({
	imports: [AccountModule, LoggerModule, AuthorizationModule, UserModule, DeletionModule],
	providers: [AccountUc],
	controllers: [AccountController],
	exports: [],
})
export class AccountApiModule {}
