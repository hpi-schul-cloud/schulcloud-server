import { Module } from '@nestjs/common';
import { OauthModule } from '@src/modules/oauth';
import { LoggerModule } from '@src/core/logger';
import { ProvisioningModule } from '@src/modules/provisioning';
import { AuthenticationModule } from '@src/modules/authentication/authentication.module';
import { UserLoginMigrationController } from './controller/user-login-migration.controller';
import { UserMigrationController } from './controller/user-migration.controller';
import { PageContentMapper } from './mapper';
import { UserLoginMigrationUc } from './uc/user-login-migration.uc';
import { UserLoginMigrationModule } from './user-login-migration.module';
import { SchoolModule } from '../school';
import { AuthorizationModule } from '../authorization';
import { StartUserLoginMigrationUc } from './uc/start-user-login-migration.uc';
import { RestartUserLoginMigrationUc } from './uc/restart-user-login-migration.uc';
import { ToggleUserLoginMigrationUc } from './uc/toggle-user-login-migration.uc';

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
		ToggleUserLoginMigrationUc,
		StartUserLoginMigrationUc,
		RestartUserLoginMigrationUc,
		PageContentMapper,
	],
	controllers: [UserMigrationController, UserLoginMigrationController],
})
export class UserLoginMigrationApiModule {}
