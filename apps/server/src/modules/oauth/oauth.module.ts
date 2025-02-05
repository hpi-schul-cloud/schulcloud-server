import { LoggerModule } from '@core/logger';
import { CacheWrapperModule } from '@infra/cache';
import { EncryptionModule } from '@infra/encryption';
import { AuthorizationModule } from '@modules/authorization';
import { LegacySchoolModule } from '@modules/legacy-school';
import { ProvisioningModule } from '@modules/provisioning';
import { SystemModule } from '@modules/system';
import { UserModule } from '@modules/user';
import { UserLoginMigrationModule } from '@modules/user-login-migration';
import { OauthAdapterModule } from '@modules/oauth-adapter';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { LtiToolRepo } from '@shared/repo/ltitool';
import { OAUTH_SESSION_TOKEN_REPO, OauthSessionTokenMikroOrmRepo } from './repo';
import { HydraSsoService, OAuthService, OauthSessionTokenService } from './service';

@Module({
	imports: [
		LoggerModule,
		AuthorizationModule,
		HttpModule,
		EncryptionModule,
		UserModule,
		ProvisioningModule,
		SystemModule,
		CacheWrapperModule,
		UserLoginMigrationModule,
		LegacySchoolModule,
		OauthAdapterModule,
	],
	providers: [
		OAuthService,
		HydraSsoService,
		LtiToolRepo,
		{ provide: OAUTH_SESSION_TOKEN_REPO, useClass: OauthSessionTokenMikroOrmRepo },
		OauthSessionTokenService,
	],
	exports: [OAuthService, HydraSsoService, OauthSessionTokenService],
})
export class OauthModule {}
