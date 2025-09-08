import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../../authorization';
import { RoleModule } from '../../role';
import { UserModule } from '../user.module';
import { AdminApiStudentsController, AdminApiTeachersController } from './controller';
import { UsersAdminApiUc } from './uc';
import { UsersAdminModule } from './users-admin.module';

@Module({
	imports: [UsersAdminModule, RoleModule, AuthorizationModule, UserModule],
	controllers: [AdminApiStudentsController, AdminApiTeachersController],
	providers: [UsersAdminApiUc],
	exports: [],
})
export class UsersAdminApiModule {}
