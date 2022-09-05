import { Module } from '@nestjs/common';
import { PermissionService } from '@shared/domain';
import { RoleRepo, SchoolRepo, UserRepo } from '@shared/repo';
import { RoleModule } from '@src/modules/role/role.module';
import { RoleService } from '@src/modules/role/service/role.service';
import { SchoolModule } from '@src/modules/school/school.module';
import { UserService } from '@src/modules/user/service/user.service';
import { UserController } from './controller';
import { UserUc } from './uc';

@Module({
	imports: [SchoolModule, RoleModule],
	providers: [UserRepo, PermissionService, UserService, RoleRepo, SchoolRepo, RoleService],
	exports: [UserService],
})
export class UserModule {}
@Module({
	imports: [UserModule],
	providers: [UserUc],
	controllers: [UserController],
})
export class UserRootModule {}
