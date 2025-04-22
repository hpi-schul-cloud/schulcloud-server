import { AccountModule } from '@modules/account';
import { RoleModule } from '@modules/role';
import { Module } from '@nestjs/common';
import { UserController, UserUc } from './api';
import { UserModule } from './user.module';
import { DeletionModule } from '@modules/deletion';

@Module({
	imports: [UserModule, RoleModule, AccountModule, DeletionModule],
	controllers: [UserController],
	providers: [UserUc],
})
export class UserApiModule {}
