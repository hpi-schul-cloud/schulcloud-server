import { AuthenticationModule } from '@modules/authentication/authentication.module';
import { AuthorizationModule } from '@modules/authorization';
import { LegacySchoolModule } from '@modules/legacy-school';
import { OauthModule } from '@modules/oauth';
import { ProvisioningModule } from '@modules/provisioning';
import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { UserLoginMigrationController } from './controller/user-login-migration.controller';
import {
	CloseUserLoginMigrationUc,
	RestartUserLoginMigrationUc,
	StartUserLoginMigrationUc,
	ToggleUserLoginMigrationUc,
	UserLoginMigrationUc,
} from './uc';
import { UserLoginMigrationModule } from './user-login-migration.module';

@Module({
	imports: [
		UserLoginMigrationModule,
		OauthModule,
		ProvisioningModule,
		AuthenticationModule,
		AuthorizationModule,
		LoggerModule,
		LegacySchoolModule,
	],
	providers: [
		UserLoginMigrationUc,
		StartUserLoginMigrationUc,
		RestartUserLoginMigrationUc,
		ToggleUserLoginMigrationUc,
		CloseUserLoginMigrationUc,
	],
	controllers: [UserLoginMigrationController],
})
export class UserLoginMigrationApiModule {}
