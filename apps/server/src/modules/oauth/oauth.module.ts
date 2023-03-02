import { HttpModule } from '@nestjs/axios';
import { forwardRef, Module } from '@nestjs/common';
import { EncryptionModule } from '@shared/infra/encryption';
import { LtiToolRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { AuthenticationModule } from '@src/modules/authentication/authentication.module';
import { AuthorizationModule } from '@src/modules/authorization';
import { UserModule } from '@src/modules/user';
import { UserLoginMigrationModule } from '@src/modules/user-login-migration';
import { ProvisioningModule } from '@src/modules/provisioning';
import { SystemModule } from '@src/modules/system';
import { HydraSsoService } from './service/hydra.service';
import { OAuthService } from './service/oauth.service';
import { OauthAdapterService } from './service/oauth-adapter.service';

@Module({
	imports: [
		LoggerModule,
		forwardRef(() => AuthenticationModule),
		AuthorizationModule,
		HttpModule,
		EncryptionModule,
		UserModule,
		ProvisioningModule,
		SystemModule,
		UserLoginMigrationModule,
	],
	providers: [OAuthService, OauthAdapterService, HydraSsoService, LtiToolRepo],
	exports: [OAuthService, HydraSsoService],
})
export class OauthModule {}
