import { Module } from '@nestjs/common';
import { RoleRepo, UserRepo } from '@shared/repo';
import { UserController } from './controller';
import { UserUC, RoleUC } from './uc';
import { UserFacade } from './user.facade';

@Module({
	controllers: [UserController],
	providers: [RoleRepo, UserRepo, UserUC, RoleUC, UserFacade],
	exports: [UserFacade],
})
export class UserModule {}
