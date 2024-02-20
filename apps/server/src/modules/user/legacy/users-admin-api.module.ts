import { Module } from '@nestjs/common';
import { UserModule } from '..';
import { RoleModule } from '../../role';
import { AuthorizationModule } from '../../authorization';
import { AdminApiStudentsController, AdminApiTeachersController } from './controller';
import { AdminApiUsersUc } from './uc';
import { AccountModule } from '../../account';

@Module({
	imports: [UserModule, RoleModule, AccountModule, AuthorizationModule],
	controllers: [AdminApiStudentsController, AdminApiTeachersController],
	providers: [AdminApiUsersUc],
})
export class UsersAdminApiModule {}
