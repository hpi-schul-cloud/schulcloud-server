import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { SystemModule } from '@src/modules/system';
import { UserModule } from '@src/modules/user';
import { UserLoginMigrationModule } from '@src/modules/user-login-migration';
import { SchoolModule } from '@src/modules/school';
import { ProvisioningModule } from '@src/modules/provisioning';
import { AuthenticationModule } from '@src/modules/authentication/authentication.module';
import { AuthorizationModule } from '../authorization';
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
