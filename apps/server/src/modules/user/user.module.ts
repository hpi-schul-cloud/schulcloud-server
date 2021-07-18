import { Module } from '@nestjs/common';
import { UserController } from './controller';
import { UserUC, RoleUC, GroupUC } from './uc';
import { RoleRepo, UserRepo, GroupRepo } from './repo';
import { UserFacade } from './user.facade';

@Module({
	controllers: [UserController],
	providers: [RoleRepo, UserRepo, GroupRepo, UserUC, RoleUC, GroupUC, UserFacade],
	exports: [UserFacade],
})
export class UserModule {}
