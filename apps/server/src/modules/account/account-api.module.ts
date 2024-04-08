import { AuthorizationModule } from '@modules/authorization';
import { Module } from '@nestjs/common';
import { PermissionService } from '@shared/domain/service';
import { UserRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { AccountUc } from './uc/account.uc';
import { AccountModule } from './account.module';
import { AccountController } from './controller/account.controller';

@Module({
	imports: [AccountModule, LoggerModule, AuthorizationModule],
	providers: [UserRepo, PermissionService, AccountUc],
	controllers: [AccountController],
	exports: [],
})
export class AccountApiModule {}
