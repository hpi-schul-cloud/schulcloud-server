import { forwardRef, Module } from '@nestjs/common';
import { PermissionService } from '@shared/domain';
import { RoleRepo, SchoolRepo, UserRepo } from '@shared/repo';
import { UserService } from '@src/modules/user/service/user.service';
import { RoleUc } from '@src/modules/role/uc/role.uc';
// eslint-disable-next-line import/no-cycle
import { SchoolModule } from '@src/modules/school/school.module';
import { RoleModule } from '@src/modules/role/role.module';
import { RoleService } from '@src/modules/role/service/role.service';
import { UserController } from './controller';
import { UserUc } from './uc';
import { LoggerModule } from '../../core/logger';

@Module({
	imports: [forwardRef(() => SchoolModule), RoleModule, LoggerModule],
	controllers: [UserController],
	providers: [UserRepo, PermissionService, UserUc, UserService, RoleRepo, RoleUc, SchoolRepo, RoleService],
	exports: [UserUc, UserService],
})
export class UserModule {}
