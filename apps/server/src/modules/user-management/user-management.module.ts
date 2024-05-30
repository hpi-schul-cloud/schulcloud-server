import { Module } from '@nestjs/common';
import { UserListController } from './api/user-list.controller';
import { ClassMikroOrmRepo } from './repo/class.repo';
import { RoleMikroOrmRepo } from './repo/role.repo';
import { UserMikroOrmRepo } from './repo/user.repo';
import { GetUserListUc } from './uc/get-user-list.uc';
import { CLASS_REPO } from './uc/interface/class.repo.interface';
import { ROLE_REPO } from './uc/interface/role.repo.interface';
import { USER_REPO } from './uc/interface/user.repo.interface';

@Module({
	controllers: [UserListController],
	providers: [
		GetUserListUc,
		{ provide: USER_REPO, useClass: UserMikroOrmRepo },
		{ provide: CLASS_REPO, useClass: ClassMikroOrmRepo },
		{ provide: ROLE_REPO, useClass: RoleMikroOrmRepo },
	],
})
export class UserManagementModule {}
