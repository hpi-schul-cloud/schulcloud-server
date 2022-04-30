import { Module } from '@nestjs/common';

import { PermissionService } from '@shared/domain';
import { UserRepo } from '@shared/repo';

import { UserController } from './controller';
import { UserConfig } from './user.config';
import { UserUC } from './uc';

@Module({
	controllers: [UserController],
	providers: [UserRepo, PermissionService, UserUC, UserConfig],
})
export class UserModule {}
