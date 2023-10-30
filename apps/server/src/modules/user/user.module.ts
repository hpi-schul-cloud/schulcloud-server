import { Module } from '@nestjs/common';
import { UserDORepo } from '@shared/repo/user/user-do.repo';
import { UserRepo } from '@shared/repo/user/user.repo';
import { LoggerModule } from '@src/core/logger/logger.module';
import { AccountModule } from '../account/account.module';
import { LegacySchoolModule } from '../legacy-school/legacy-school.module';
import { RoleModule } from '../role/role.module';
import { UserService } from './service/user.service';

@Module({
	imports: [LegacySchoolModule, RoleModule, AccountModule, LoggerModule],
	providers: [UserRepo, UserDORepo, UserService],
	exports: [UserService, UserRepo],
})
export class UserModule {}
