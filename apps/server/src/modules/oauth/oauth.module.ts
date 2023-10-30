import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CacheWrapperModule } from '@shared/infra/cache/cache.module';
import { EncryptionModule } from '@shared/infra/encryption/encryption.module';
import { LtiToolRepo } from '@shared/repo/ltitool/ltitool.repo';
import { LoggerModule } from '@src/core/logger/logger.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { LegacySchoolModule } from '../legacy-school/legacy-school.module';
import { ProvisioningModule } from '../provisioning/provisioning.module';
import { SystemModule } from '../system/system.module';
import { UserLoginMigrationModule } from '../user-login-migration/user-login-migration.module';
import { UserModule } from '../user/user.module';
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
