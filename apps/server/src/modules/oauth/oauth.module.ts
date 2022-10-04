import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { EncryptionModule } from '@shared/infra/encryption';
import { LtiToolRepo, SystemRepo, UserRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { OAuthService } from '@src/modules/oauth/service/oauth.service';
import { HydraOauthUc } from '@src/modules/oauth/uc/hydraOauth.uc';
import { HydraSsoService } from '@src/modules/oauth/service/hydra.service';
import { ProvisioningModule } from '@src/modules/provisioning/provisioning.module';
import { AuthorizationModule } from '../authorization';
import { OauthSSOController } from './controller/oauth-sso.controller';
import { OauthUc } from './uc/oauth.uc';

@Module({
	imports: [LoggerModule, AuthorizationModule, HttpModule, ProvisioningModule, EncryptionModule],
	controllers: [OauthSSOController],
	providers: [OauthUc, HydraOauthUc, UserRepo, SystemRepo, OAuthService, HydraSsoService, LtiToolRepo],
	exports: [OauthUc],
})
export class OauthModule {}
