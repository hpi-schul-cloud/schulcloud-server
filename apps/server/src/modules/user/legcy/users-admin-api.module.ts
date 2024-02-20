import { Module } from '@nestjs/common';
import { UserModule } from '..';
import { RoleModule } from '../../role';
import { AuthorizationModule } from '../../authorization';
import { AdminApiStudentsController, AdminApiTeachersController } from './controller';
import { AdminApiUsersUc } from './uc';

@Module({
	imports: [UserModule, RoleModule, AuthorizationModule],
	controllers: [AdminApiStudentsController, AdminApiTeachersController],
	providers: [AdminApiUsersUc],
})
export class UsersAdminApiModule {}
