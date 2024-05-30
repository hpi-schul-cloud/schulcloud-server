import { Module } from '@nestjs/common';
import { UserListController } from './api/user-list.controller';
import { ClassMikroOrmRepo } from './repo/class.repo';
import { UserMikroOrmRepo } from './repo/user.repo';
import { GetUserListUc } from './uc/get-user-list.uc';

@Module({
	controllers: [UserListController],
	providers: [GetUserListUc, UserMikroOrmRepo, ClassMikroOrmRepo],
})
export class UserManagementModule {}
