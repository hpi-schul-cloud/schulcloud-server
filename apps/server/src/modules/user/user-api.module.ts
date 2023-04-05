import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../authorization';
import { UserController } from './controller';
import { UserUc } from './uc';
import { UserModule } from './user.module';

@Module({
	imports: [UserModule, AuthorizationModule],
	controllers: [UserController],
	providers: [UserUc],
})
export class UserApiModule {}
