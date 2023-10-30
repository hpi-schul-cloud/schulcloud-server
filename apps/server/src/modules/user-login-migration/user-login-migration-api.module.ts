import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger/logger.module';
import { AuthenticationModule } from '../authentication/authentication.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { LegacySchoolModule } from '../legacy-school/legacy-school.module';
import { OauthModule } from '../oauth/oauth.module';
import { ProvisioningModule } from '../provisioning/provisioning.module';
import { UserLoginMigrationController } from './controller/user-login-migration.controller';
import { UserMigrationController } from './controller/user-migration.controller';
import { PageContentMapper } from './mapper/page-content.mapper';
import { CloseUserLoginMigrationUc } from './uc/close-user-login-migration.uc';
import { RestartUserLoginMigrationUc } from './uc/restart-user-login-migration.uc';
import { StartUserLoginMigrationUc } from './uc/start-user-login-migration.uc';
import { ToggleUserLoginMigrationUc } from './uc/toggle-user-login-migration.uc';
import { UserLoginMigrationUc } from './uc/user-login-migration.uc';
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
		PageContentMapper,
	],
	controllers: [UserMigrationController, UserLoginMigrationController],
})
export class UserLoginMigrationApiModule {}
