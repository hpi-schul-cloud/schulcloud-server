import { Module } from '@nestjs/common';
import { UserController } from './controller';
import { UserUC } from './uc';
import { RoleRepo, UserRepo } from './repo';
import { UserFacade } from './user.facade';

@Module({
	controllers: [UserController],
	providers: [RoleRepo, UserRepo, UserUC, UserFacade],
	exports: [UserFacade],
})
export class UserModule {}
