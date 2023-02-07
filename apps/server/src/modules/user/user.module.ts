import { Module } from '@nestjs/common';
import { PermissionService } from '@shared/domain';
import { RoleRepo, SchoolRepo, UserRepo } from '@shared/repo';
import { UserDORepo } from '@shared/repo/user/user-do.repo';
import { LoggerModule } from '@src/core/logger';
import { AccountModule } from '@src/modules/account';
import { RoleModule } from '@src/modules/role/role.module';
import { RoleService } from '@src/modules/role/service/role.service';
import { RoleUc } from '@src/modules/role/uc/role.uc';
import { SchoolModule } from '@src/modules/school/school.module';
import { UserController } from './controller';
import { UserService } from './service/user.service';
import { UserUc } from './uc';

@Module({
	imports: [SchoolModule, RoleModule, LoggerModule, AccountModule],
	controllers: [UserController],
	providers: [UserRepo, UserDORepo, PermissionService, UserUc, UserService, RoleRepo, RoleUc, SchoolRepo, RoleService],
	exports: [UserUc, UserService],
})
export class UserModule {}
