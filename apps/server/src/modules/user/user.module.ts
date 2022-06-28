import { Module } from '@nestjs/common';
import { PermissionService } from '@shared/domain';
import { RoleRepo, UserRepo } from '@shared/repo';
import { UserService } from '@src/modules/user/service/user.service';
import { UserController } from './controller';
import { UserUc } from './uc';

@Module({
	controllers: [UserController],
	providers: [UserRepo, PermissionService, UserUc, UserService, RoleRepo],
	exports: [UserUc, UserService],
})
export class UserModule {}
