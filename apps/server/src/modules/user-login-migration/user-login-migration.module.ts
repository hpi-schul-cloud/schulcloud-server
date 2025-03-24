import { LoggerModule } from '@core/logger';
import { AccountModule } from '@modules/account';
import { LegacySchoolModule } from '@modules/legacy-school';
import { SystemModule } from '@modules/system';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import {
	MigrationCheckService,
	SchoolMigrationService,
	UserLoginMigrationRevertService,
	UserLoginMigrationRollbackService,
	UserLoginMigrationService,
	UserMigrationService,
} from './domain/service';
import { UserLoginMigrationRepo } from './repo';

@Module({
	imports: [UserModule, LegacySchoolModule, LoggerModule, AccountModule, SystemModule],
	providers: [
		UserMigrationService,
		SchoolMigrationService,
		MigrationCheckService,
		UserLoginMigrationService,
		UserLoginMigrationRepo,
		UserLoginMigrationRevertService,
		UserLoginMigrationRollbackService,
	],
	exports: [
		UserMigrationService,
		SchoolMigrationService,
		MigrationCheckService,
		UserLoginMigrationService,
		UserLoginMigrationRevertService,
		UserLoginMigrationRollbackService,
	],
})
export class UserLoginMigrationModule {}
