import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { AuthenticationModule } from '@src/modules/authentication/authentication.module';
import { AuthorizationModule } from '@src/modules/authorization';
import { ProvisioningModule } from '@src/modules/provisioning';
import { SchoolModule } from '@src/modules/school-migration';
import { SystemModule } from '@src/modules/system';
import { UserModule } from '@src/modules/user';
import { UserLoginMigrationModule } from '@src/modules/user-login-migration';
import { OauthSSOController } from './controller/oauth-sso.controller';
import { OauthModule } from './oauth.module';
import { HydraOauthUc, OauthUc } from './uc';

@Module({
	imports: [
		OauthModule,
		AuthenticationModule,
		AuthorizationModule,
		ProvisioningModule,
		SchoolModule,
		UserLoginMigrationModule,
		SystemModule,
		UserModule,
		LoggerModule,
	],
	controllers: [OauthSSOController],
	providers: [OauthUc, HydraOauthUc],
})
export class OauthApiModule {}
