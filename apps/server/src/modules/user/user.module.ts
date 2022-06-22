import { Module } from '@nestjs/common';
import { PermissionService } from '@shared/domain';
import { UserRepo } from '@shared/repo';
import { UserController } from './controller';
import { UserUc } from './uc';

@Module({
	controllers: [UserController],
	providers: [UserRepo, PermissionService, UserUc],
})
export class UserModule {}
