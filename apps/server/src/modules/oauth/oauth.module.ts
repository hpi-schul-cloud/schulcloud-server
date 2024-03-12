import { CacheWrapperModule } from '@infra/cache';
import { EncryptionModule } from '@infra/encryption';
import { AuthorizationModule } from '@modules/authorization';
import { LegacySchoolModule } from '@modules/legacy-school';
import { ProvisioningModule } from '@modules/provisioning';
import { SystemModule } from '@modules/system';
import { UserLoginMigrationModule } from '@modules/user-login-migration';
import { UserModule } from '@modules/user/user.module';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { LtiToolRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { HydraSsoService, OauthAdapterService, OAuthService } from './service';

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
	],
	providers: [OAuthService, OauthAdapterService, HydraSsoService, LtiToolRepo],
	exports: [OAuthService, HydraSsoService, OauthAdapterService],
})
export class OauthModule {}
