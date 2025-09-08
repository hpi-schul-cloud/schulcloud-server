import { AccountModule } from '@modules/account';
import { RoleModule } from '@modules/role';
import { Module } from '@nestjs/common';
import { AdminApiUsersController, AdminApiUserUc } from './api';
import { UserModule } from './user.module';

@Module({
	imports: [UserModule, RoleModule, AccountModule],
	controllers: [AdminApiUsersController],
	providers: [AdminApiUserUc],
})
export class UserAdminApiModule {}
