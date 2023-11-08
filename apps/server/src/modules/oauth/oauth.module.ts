import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CacheWrapperModule } from '@infra/cache';
import { EncryptionModule } from '@infra/encryption';
import { LtiToolRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '@modules/authorization';
import { ProvisioningModule } from '@modules/provisioning';
import { LegacySchoolModule } from '@modules/legacy-school';
import { SystemModule } from '@modules/system';
import { UserModule } from '@modules/user';
import { UserLoginMigrationModule } from '@modules/user-login-migration';
import { HydraSsoService } from './service/hydra.service';
import { OauthAdapterService } from './service/oauth-adapter.service';
import { OAuthService } from './service/oauth.service';

@Module({
	imports: [
		LoggerModule,
		AuthorizationModule,
		HttpModule,
		EncryptionModule,
		UserModule,
		ProvisioningModule,
		SystemModule,
		UserLoginMigrationModule,
		CacheWrapperModule,
		LegacySchoolModule,
	],
	providers: [OAuthService, OauthAdapterService, HydraSsoService, LtiToolRepo],
	exports: [OAuthService, HydraSsoService],
})
export class OauthModule {}
