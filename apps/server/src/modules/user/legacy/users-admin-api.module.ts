import { Module } from '@nestjs/common';
import { UserRepo } from '@shared/repo';
import { RoleModule } from '../../role';
import { AuthorizationModule } from '../../authorization';
import { AdminApiStudentsController, AdminApiTeachersController } from './controller';
import { AdminApiUsersUc } from './uc';
import { UsersAdminModule } from './users-admin.module';

@Module({
	imports: [UsersAdminModule, RoleModule, AuthorizationModule],
	controllers: [AdminApiStudentsController, AdminApiTeachersController],
	providers: [UserRepo, AdminApiUsersUc],
	exports: [],
})
export class UsersAdminApiModule {}
