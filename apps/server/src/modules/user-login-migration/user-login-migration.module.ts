import { Module } from '@nestjs/common';
import { UserLoginMigrationRepo } from '@shared/repo/userloginmigration/user-login-migration.repo';
import { LoggerModule } from '@src/core/logger';
import { AccountModule } from '@src/modules/account';
import { SchoolModule } from '@src/modules/school';
import { SystemModule } from '@src/modules/system';
import { UserModule } from '@src/modules/user';
import {
	MigrationCheckService,
	SchoolMigrationService,
	UserLoginMigrationService,
	UserMigrationService,
} from './service';

@Module({
	imports: [UserModule, SchoolModule, LoggerModule, AccountModule, SystemModule],
	providers: [
		UserMigrationService,
		SchoolMigrationService,
		MigrationCheckService,
		UserLoginMigrationService,
		UserLoginMigrationRepo,
	],
	exports: [UserMigrationService, SchoolMigrationService, MigrationCheckService, UserLoginMigrationService],
})
export class UserLoginMigrationModule {}
