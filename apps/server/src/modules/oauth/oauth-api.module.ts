import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger/logger.module';
import { AuthenticationModule } from '../authentication/authentication.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { LegacySchoolModule } from '../legacy-school/legacy-school.module';
import { ProvisioningModule } from '../provisioning/provisioning.module';
import { SystemModule } from '../system/system.module';
import { UserLoginMigrationModule } from '../user-login-migration/user-login-migration.module';
import { UserModule } from '../user/user.module';
import { OauthSSOController } from './controller/oauth-sso.controller';
import { OauthModule } from './oauth.module';
import { HydraOauthUc } from './uc/hydra-oauth.uc';
import { OauthUc } from './uc/oauth.uc';

@Module({
	imports: [
		OauthModule,
		AuthenticationModule,
		AuthorizationModule,
		ProvisioningModule,
		LegacySchoolModule,
		UserLoginMigrationModule,
		SystemModule,
		UserModule,
		LoggerModule,
	],
	controllers: [OauthSSOController],
	providers: [OauthUc, HydraOauthUc],
})
export class OauthApiModule {}
