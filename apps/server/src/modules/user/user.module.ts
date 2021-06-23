import { Module } from '@nestjs/common';
import { UserController } from './controller';
import { UserUC } from './uc';
import { RoleRepo, UserRepo } from './repo';

@Module({
	controllers: [UserController],
	providers: [RoleRepo, UserRepo, UserUC],
})
export class UserModule {}
