import { Module } from '@nestjs/common';
import { PermissionService } from '@shared/domain';
import { UserController } from './controller';
import { UserUc } from './uc';
import { UserModule } from './user.module';

@Module({
	imports: [UserModule],
	controllers: [UserController],
	providers: [PermissionService, UserUc],
})
export class UserApiModule {}
