import { AuthorizationModule } from '@modules/authorization';
import { Module } from '@nestjs/common';
import { RoleModule } from '../role';
import { SchoolModule } from '../school';
import { UserListController } from './api/user-list.controller';
import { GetUserListUc } from './uc/get-user-list.uc';
import { UserManagementModule } from './user-management.module';

@Module({
	imports: [UserManagementModule, AuthorizationModule, SchoolModule, RoleModule],
	controllers: [UserListController],
	providers: [GetUserListUc],
})
export class UserManagementApiModule {}
