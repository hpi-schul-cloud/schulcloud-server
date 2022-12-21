import { forwardRef, Module } from '@nestjs/common';
import { PermissionService } from '@shared/domain';
import { RoleRepo, SchoolRepo, UserRepo } from '@shared/repo';
import { UserService } from '@src/modules/user/service/user.service';
import { RoleUc } from '@src/modules/role/uc/role.uc';
import { RoleModule } from '@src/modules/role/role.module';
import { RoleService } from '@src/modules/role/service/role.service';
import { UserController } from './controller';
import { UserUc } from './uc';
import { LoggerModule } from '../../core/logger';
import { SchoolApiModule } from '../school/school-api.module';

@Module({
	imports: [forwardRef(() => SchoolApiModule), RoleModule, LoggerModule],
	controllers: [UserController],
	providers: [UserRepo, PermissionService, UserUc, UserService, RoleRepo, RoleUc, SchoolRepo, RoleService],
	exports: [UserUc, UserService],
})
export class UserModule {}
