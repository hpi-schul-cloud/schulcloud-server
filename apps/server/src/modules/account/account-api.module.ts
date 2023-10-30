import { Module } from '@nestjs/common';
import { PermissionService } from '@shared/domain/service/permission.service';
import { UserRepo } from '@shared/repo/user/user.repo';
import { LoggerModule } from '@src/core/logger/logger.module';
import { AccountModule } from './account.module';
import { AccountController } from './controller/account.controller';
import { AccountUc } from './uc/account.uc';

@Module({
	imports: [AccountModule, LoggerModule],
	providers: [UserRepo, PermissionService, AccountUc],
	controllers: [AccountController],
	exports: [],
})
export class AccountApiModule {}
