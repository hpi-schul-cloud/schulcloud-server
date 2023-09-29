import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { AuthenticationModule } from '@src/modules/authentication/authentication.module';
import { AuthorizationModule } from '@src/modules/authorization';
import { OauthModule } from '@src/modules/oauth';
import { ProvisioningModule } from '@src/modules/provisioning';
import { SchoolModule } from '@src/modules/school';
import { UserLoginMigrationController } from './controller/user-login-migration.controller';
import { UserMigrationController } from './controller/user-migration.controller';
import { PageContentMapper } from './mapper';
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
		SchoolModule,
	],
	providers: [
		UserLoginMigrationUc,
		StartUserLoginMigrationUc,
		RestartUserLoginMigrationUc,
		ToggleUserLoginMigrationUc,
		CloseUserLoginMigrationUc,
		PageContentMapper,
	],
	controllers: [UserMigrationController, UserLoginMigrationController],
})
export class UserLoginMigrationApiModule {}
