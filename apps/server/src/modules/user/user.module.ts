import { Module } from '@nestjs/common';
import { UserRepo } from '@shared/repo';
import { UserDORepo } from '@shared/repo/user/user-do.repo';
import { LoggerModule } from '@src/core/logger';
import { AccountModule } from '@src/modules/account';
import { RoleModule } from '@src/modules/role/role.module';
import { LegacySchoolModule } from '@src/modules/school-migration';
import { UserService } from './service/user.service';

@Module({
	imports: [LegacySchoolModule, RoleModule, AccountModule, LoggerModule],
	providers: [UserRepo, UserDORepo, UserService],
	exports: [UserService, UserRepo],
})
export class UserModule {}
