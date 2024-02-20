import { Module } from '@nestjs/common';
import { RoleModule } from '../../role';
import { AuthorizationModule } from '../../authorization';
import { AdminApiStudentsController, AdminApiTeachersController } from './controller';
import { AdminApiUsersUc } from './uc';
import { UsersAdminModule } from './users-admin.module';
import { UserRepo } from "@shared/repo";

@Module({
	imports: [UsersAdminModule, RoleModule, AuthorizationModule],
	controllers: [AdminApiStudentsController, AdminApiTeachersController],
	providers: [AdminApiUsersUc, UserRepo],
})
export class UsersAdminApiModule {}
