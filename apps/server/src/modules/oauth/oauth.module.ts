import { LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { EncryptionModule } from '@infra/encryption';
import { AuthorizationModule } from '@modules/authorization';
import { LegacySchoolModule } from '@modules/legacy-school';
import { OauthAdapterModule } from '@modules/oauth-adapter';
import { ProvisioningModule } from '@modules/provisioning';
import { SystemModule } from '@modules/system';
import { UserModule } from '@modules/user';
import { UserLoginMigrationModule } from '@modules/user-login-migration';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { OAUTH_ENCRYPTION_CONFIG_TOKEN, OauthEncryptionConfig } from './encryption.config';
import { OAUTH_PUBLIC_API_CONFIG_TOKEN, OauthPublicApiConfig } from './oauth.config';
import { OAUTH_SESSION_TOKEN_REPO, OauthSessionTokenMikroOrmRepo } from './repo';
import { OAuthService, OauthSessionTokenService } from './service';

@Module({
	imports: [
		LoggerModule,
		AuthorizationModule,
		HttpModule,
		EncryptionModule.register(OAUTH_ENCRYPTION_CONFIG_TOKEN, OauthEncryptionConfig),
		UserModule,
		ProvisioningModule,
		SystemModule,
		UserLoginMigrationModule,
		LegacySchoolModule,
		OauthAdapterModule,
		ConfigurationModule.register(OAUTH_PUBLIC_API_CONFIG_TOKEN, OauthPublicApiConfig),
	],
	providers: [
		OAuthService,
		{ provide: OAUTH_SESSION_TOKEN_REPO, useClass: OauthSessionTokenMikroOrmRepo },
		OauthSessionTokenService,
	],
	exports: [OAuthService, OauthSessionTokenService],
})
export class OauthModule {}
