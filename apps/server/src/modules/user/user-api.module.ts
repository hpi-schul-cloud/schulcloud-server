import { Module } from '@nestjs/common';
import { AccountModule } from '../account';
import { RoleModule } from '../role';
import { UserController } from './controller';
import { AdminApiUsersController } from './controller/admin-api-user.controller';
import { UserUc } from './uc';
import { AdminApiUserUc } from './uc/admin-api-user.uc';
import { UserModule } from './user.module';

@Module({
	imports: [UserModule, RoleModule, AccountModule],
	controllers: [UserController, AdminApiUsersController],
	providers: [UserUc, AdminApiUserUc],
})
export class UserApiModule {}
