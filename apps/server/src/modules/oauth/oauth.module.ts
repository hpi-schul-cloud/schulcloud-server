import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { EncryptionModule } from '@shared/infra/encryption';
import { UserRepo } from '@shared/repo';
import { SystemRepo } from '@shared/repo/system';
import { LoggerModule } from '@src/core/logger';
import { IservOAuthService } from '@src/modules/oauth/service/iserv-oauth.service';
import { OAuthService } from '@src/modules/oauth/service/oauth.service';
import { AuthorizationModule } from '../authorization';
import { OauthSSOController } from './controller/oauth-sso.controller';
import { OauthUc } from './uc/oauth.uc';

@Module({
	imports: [LoggerModule, AuthorizationModule, HttpModule, EncryptionModule],
	controllers: [OauthSSOController],
	providers: [OauthUc, SystemRepo, UserRepo, OAuthService, IservOAuthService],
	exports: [OauthUc],
})
export class OauthModule {}
