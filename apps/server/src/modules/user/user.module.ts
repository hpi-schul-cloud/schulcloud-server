import { Module } from '@nestjs/common';
import { PermissionService } from '@shared/domain';
import { AccountRepo, SystemRepo, UserRepo } from '@shared/repo';
import { AccountService } from '../authentication/services/account.service';
import { AuthorizationModule } from '../authorization';
import { UserController } from './controller';
import { UserUC } from './uc';

@Module({
	imports: [AuthorizationModule],
	controllers: [UserController],
	providers: [UserRepo, PermissionService, UserUC, AccountService, AccountRepo, SystemRepo],
})
export class UserModule {}
