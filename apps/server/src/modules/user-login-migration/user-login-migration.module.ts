import { Module } from '@nestjs/common';
import { UserLoginMigrationRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { AccountModule } from '@src/modules/account';
import { SchoolModule } from '@src/modules/school';
import { SystemModule } from '@src/modules/system';
import { UserModule } from '@src/modules/user';
import {
	MigrationCheckService,
	RestartUserLoginMigrationValidationService,
	SchoolMigrationService,
	UserLoginMigrationService,
	UserMigrationService,
	StartUserLoginMigrationValidationService,
} from './service';
import { AuthorizationModule } from '../authorization';
import { CommonUserLoginMigrationService } from './service/common-user-login-migration.service';

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
	],
})
export class UserLoginMigrationModule {}
