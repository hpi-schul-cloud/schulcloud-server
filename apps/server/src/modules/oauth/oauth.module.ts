import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { EncryptionModule } from '@shared/infra/encryption';
import { LtiToolRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { OAuthService } from '@src/modules/oauth/service/oauth.service';
import { HydraSsoService } from '@src/modules/oauth/service/hydra.service';
import { ProvisioningModule } from '@src/modules/provisioning/provisioning.module';
import { UserDORepo } from '@shared/repo/user/user-do.repo';
import { SystemModule } from '../system';

@Module({
	imports: [LoggerModule, HttpModule, ProvisioningModule, EncryptionModule, SystemModule],
	providers: [UserDORepo, OAuthService, HydraSsoService, LtiToolRepo],
	exports: [OAuthService, HydraSsoService],
})
export class OauthModule {}
