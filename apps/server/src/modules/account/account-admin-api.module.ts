import { AccountModule } from '@modules/account';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { AdminApiAccountController } from './api/admin-api-account.controller';
import { AdminApiAccountUc } from './api/admin-api-account.uc';

@Module({
	imports: [AccountModule, UserModule],
	controllers: [AdminApiAccountController],
	providers: [AdminApiAccountUc],
})
export class AccountAdminApiModule {}
