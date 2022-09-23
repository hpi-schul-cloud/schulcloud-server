import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { EncryptionModule } from '@shared/infra/encryption';
import { LtiToolRepo, UserRepo } from '@shared/repo';

import { LoggerModule } from '@src/core/logger';
import { IservOAuthService } from '@src/modules/oauth/service/iserv-oauth.service';
import { OAuthService } from '@src/modules/oauth/service/oauth.service';
import { HydraOauthUc } from '@src/modules/oauth/uc/hydraOauth.uc';
import { HydraSsoService } from '@src/modules/oauth/service/hydra.service';
import { AuthorizationModule } from '../authorization';
import { SystemModule } from '../system';
import { OauthSSOController } from './controller/oauth-sso.controller';
import { OauthUc } from './uc/oauth.uc';

@Module({
	imports: [LoggerModule, AuthorizationModule, HttpModule, EncryptionModule, SystemModule],
	controllers: [OauthSSOController],
	providers: [OauthUc, HydraOauthUc, UserRepo, OAuthService, HydraSsoService, IservOAuthService, LtiToolRepo],
	exports: [OauthUc],
})
export class OauthModule {}
