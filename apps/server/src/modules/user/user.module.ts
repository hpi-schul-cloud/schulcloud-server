import { Module } from '@nestjs/common';
import { UserRepo } from '@shared/repo';
import { UserDORepo } from '@shared/repo/user/user-do.repo';
import { LoggerModule } from '@src/core/logger';
import { AccountModule } from '@src/modules/account';
import { RoleModule } from '@src/modules/role/role.module';
import { SchoolMigrationModule } from '@src/modules/school-migration/school-migration.module';
import { UserService } from './service/user.service';

@Module({
	imports: [SchoolMigrationModule, RoleModule, AccountModule, LoggerModule],
	providers: [UserRepo, UserDORepo, UserService],
	exports: [UserService, UserRepo],
})
export class UserModule {}
