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
	StartUserLoginMigrationValidationService,
	CommonUserLoginMigrationService,
} from './service';

@Module({
	imports: [UserModule, SchoolModule, LoggerModule, AccountModule, SystemModule, AuthorizationModule],
	providers: [
		UserMigrationService,
		SchoolMigrationService,
		MigrationCheckService,
		UserLoginMigrationService,
		UserLoginMigrationRepo,
		StartUserLoginMigrationValidationService,
		RestartUserLoginMigrationValidationService,
		CommonUserLoginMigrationService,
	],
	exports: [
		UserMigrationService,
		SchoolMigrationService,
		MigrationCheckService,
		UserLoginMigrationService,
		StartUserLoginMigrationValidationService,
		RestartUserLoginMigrationValidationService,
		CommonUserLoginMigrationService,
	],
})
export class UserLoginMigrationModule {}
