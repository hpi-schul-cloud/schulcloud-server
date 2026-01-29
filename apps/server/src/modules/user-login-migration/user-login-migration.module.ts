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
import {
	USER_LOGIN_MIGRATION_PUBLIC_API_CONFIG_TOKEN,
	UserLoginMigrationPublicApiConfig,
} from './user-login-migration.config';
import { ConfigurationModule } from '@infra/configuration';

@Module({
	imports: [
		UserModule,
		LegacySchoolModule,
		LoggerModule,
		AccountModule,
		SystemModule,
		ConfigurationModule.register(USER_LOGIN_MIGRATION_PUBLIC_API_CONFIG_TOKEN, UserLoginMigrationPublicApiConfig),
	],
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
