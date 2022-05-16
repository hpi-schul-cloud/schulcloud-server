import { Module } from '@nestjs/common';
import { PermissionService } from '@shared/domain';
import { UserRepo } from '@shared/repo';
import { UserController } from './controller';
import { UserUC } from './uc';

@Module({
	controllers: [UserController],
	providers: [UserRepo, PermissionService, UserUC],
})
export class UserModule {}
