import { AuthorizationModule } from '@modules/authorization';
import { Module } from '@nestjs/common';
import { PermissionService } from '@shared/domain/service';
import { UserRepo } from '@shared/repo';
import { LoggerModule } from '../../core/logger/logger.module';
import { AccountModule } from './account.module';
import { AccountController } from './controller/account.controller';
import { AccountUc } from './uc/account.uc';

@Module({
	imports: [AccountModule, LoggerModule, AuthorizationModule],
	providers: [UserRepo, PermissionService, AccountUc],
	controllers: [AccountController],
	exports: [],
})
export class AccountApiModule {}
