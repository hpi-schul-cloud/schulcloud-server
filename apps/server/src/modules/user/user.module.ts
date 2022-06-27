import { Module } from '@nestjs/common';
import { PermissionService } from '@shared/domain';
import { UserRepo } from '@shared/repo';
import { UserController } from './controller';
import { UserUc } from './uc';
import { UserService } from '@src/modules/user/service/user.service';

@Module({
	controllers: [UserController],
	providers: [UserRepo, PermissionService, UserUc, UserService],
})
export class UserModule {}
