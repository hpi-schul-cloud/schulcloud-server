import { AuthenticationModule } from '@modules/authentication';
import { AuthorizationModule } from '@modules/authorization';
import { LegacySchoolModule } from '@modules/legacy-school';
import { OauthModule } from '@modules/oauth';
import { ProvisioningModule } from '@modules/provisioning';
import { UserModule } from '@modules/user';
import { ImportUserModule } from '@modules/user-import';
import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { UserLoginMigrationRollbackController } from './controller/user-login-migration-rollback.controller';
import { UserLoginMigrationController } from './controller/user-login-migration.controller';
import {
	CloseMigrationWizardUc,
	CloseUserLoginMigrationUc,
	RestartUserLoginMigrationUc,
	StartUserLoginMigrationUc,
	ToggleUserLoginMigrationUc,
	UserLoginMigrationRollbackUc,
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
		ImportUserModule,
		UserModule,
	],
	providers: [
		UserLoginMigrationUc,
		StartUserLoginMigrationUc,
		RestartUserLoginMigrationUc,
		ToggleUserLoginMigrationUc,
		CloseUserLoginMigrationUc,
		UserLoginMigrationRollbackUc,
		CloseMigrationWizardUc,
	],
	controllers: [UserLoginMigrationController, UserLoginMigrationRollbackController],
})
export class UserLoginMigrationApiModule {}
