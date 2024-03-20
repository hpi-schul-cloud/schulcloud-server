import { Module } from '@nestjs/common';
import { AccountModule } from '../account';
import { RoleModule } from '../role';
import { AdminApiUsersController } from './controller';
import { AdminApiUserUc } from './uc';
import { UserModule } from './user.module';

@Module({
	imports: [UserModule, RoleModule, AccountModule],
	controllers: [AdminApiUsersController],
	providers: [AdminApiUserUc],
})
export class UserAdminApiModule {}
