import { Module } from '@nestjs/common';
import { OauthModule } from '@src/modules/oauth';
import { ProvisioningModule } from '@src/modules/provisioning';
import { AuthenticationModule } from '@src/modules/authentication/authentication.module';
import { LoggerModule } from '@src/core/logger';
import { UserLoginMigrationController } from './controller/user-login-migration.controller';
import { UserMigrationController } from './controller/user-migration.controller';
import { PageContentMapper } from './mapper/page-content.mapper';
import { UserLoginMigrationUc } from './uc/user-login-migration.uc';
import { UserLoginMigrationModule } from './user-login-migration.module';

@Module({
	imports: [UserLoginMigrationModule, OauthModule, ProvisioningModule, AuthenticationModule, LoggerModule],
	providers: [UserLoginMigrationUc, PageContentMapper],
	controllers: [UserMigrationController, UserLoginMigrationController],
})
export class UserLoginMigrationApiModule {}
