import { Module } from '@nestjs/common';
import { UserController } from './controller/user.controller';
import { UserUc } from './uc/user.uc';
import { UserModule } from './user.module';

@Module({
	imports: [UserModule],
	controllers: [UserController],
	providers: [UserUc],
})
export class UserApiModule {}
