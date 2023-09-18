import { Module } from '@nestjs/common';
import { UserLoginMigrationRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { AccountModule } from '@src/modules/account';
import { LegacySchoolModule } from '@src/modules/school-migration';
import { SystemModule } from '@src/modules/system';
import { UserModule } from '@src/modules/user';
import {
	MigrationCheckService,
	SchoolMigrationService,
	UserLoginMigrationRevertService,
	UserLoginMigrationService,
	UserMigrationService,
} from './service';

@Module({
	imports: [UserModule, LegacySchoolModule, LoggerModule, AccountModule, SystemModule],
	providers: [
		UserMigrationService,
		SchoolMigrationService,
		MigrationCheckService,
		UserLoginMigrationService,
		UserLoginMigrationRepo,
		UserLoginMigrationRevertService,
	],
	exports: [
		UserMigrationService,
		SchoolMigrationService,
		MigrationCheckService,
		UserLoginMigrationService,
		UserLoginMigrationRevertService,
	],
})
export class UserLoginMigrationModule {}
