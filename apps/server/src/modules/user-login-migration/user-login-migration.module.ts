import { Module } from '@nestjs/common';
import { UserLoginMigrationRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { AccountModule } from '@src/modules/account';
import { SchoolModule } from '@src/modules/school';
import { SystemModule } from '@src/modules/system';
import { UserModule } from '@src/modules/user';
import { AuthorizationModule } from '@src/modules/authorization';
import {
	MigrationCheckService,
	RestartUserLoginMigrationValidationService,
	SchoolMigrationService,
	UserLoginMigrationService,
	UserMigrationService,
	UserLoginMigrationRevertService,
	CommonUserLoginMigrationService,
	StartUserLoginMigrationValidationService,
} from './service';

@Module({
	imports: [UserModule, SchoolModule, LoggerModule, AccountModule, SystemModule, AuthorizationModule],
	providers: [
		UserMigrationService,
		SchoolMigrationService,
		MigrationCheckService,
		UserLoginMigrationService,
		UserLoginMigrationRepo,
		UserLoginMigrationRevertService,
		StartUserLoginMigrationValidationService,
		RestartUserLoginMigrationValidationService,
		CommonUserLoginMigrationService,
	],
	exports: [
		UserMigrationService,
		SchoolMigrationService,
		MigrationCheckService,
		UserLoginMigrationService,
		UserLoginMigrationRevertService,
		StartUserLoginMigrationValidationService,
		RestartUserLoginMigrationValidationService,
		CommonUserLoginMigrationService,
	],
})
export class UserLoginMigrationModule {}
