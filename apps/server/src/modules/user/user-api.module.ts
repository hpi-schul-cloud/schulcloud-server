import { Module } from '@nestjs/common';
import { AccountModule } from '../account';
import { RoleModule } from '../role';
import { UserController } from './controller';
import { UserUc } from './uc';
import { UserModule } from './user.module';
import { DeletionModule } from '@modules/deletion';

@Module({
	imports: [UserModule, RoleModule, AccountModule, DeletionModule],
	controllers: [UserController],
	providers: [UserUc],
})
export class UserApiModule {}
