import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { AuthenticationModule } from '@modules/authentication/authentication.module';
import { AuthorizationModule } from '@modules/authorization';
import { ProvisioningModule } from '@modules/provisioning';
import { LegacySchoolModule } from '@modules/legacy-school';
import { SystemModule } from '@modules/system';
import { UserModule } from '@modules/user';
import { UserLoginMigrationModule } from '@modules/user-login-migration';
import { OauthSSOController } from './controller/oauth-sso.controller';
import { OauthModule } from './oauth.module';
import { HydraOauthUc, OauthUc } from './uc';

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
