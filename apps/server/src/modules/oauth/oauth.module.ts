import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CacheWrapperModule } from '@shared/infra/cache';
import { EncryptionModule } from '@shared/infra/encryption';
import { LtiToolRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '@src/modules/authorization';
import { ProvisioningModule } from '@src/modules/provisioning';
import { LegacySchoolModule } from '@src/modules/school-migration';
import { SystemModule } from '@src/modules/system';
import { UserModule } from '@src/modules/user';
import { UserLoginMigrationModule } from '@src/modules/user-login-migration';
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
