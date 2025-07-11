import { AccountModule } from '@modules/account';
import { CourseModule } from '@modules/course';
import { RoleModule } from '@modules/role';
import { Module } from '@nestjs/common';
import { AdminApiUsersController, AdminApiUserUc } from './api';
import { UserModule } from './user.module';

@Module({
	imports: [UserModule, RoleModule, AccountModule, CourseModule],
	controllers: [AdminApiUsersController],
	providers: [AdminApiUserUc],
})
export class UserAdminApiModule {}
