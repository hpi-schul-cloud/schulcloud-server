import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { HydraOauthUc } from '@src/modules/oauth/uc/hydra-oauth.uc';
import { AuthorizationModule } from '../authorization';
import { SystemModule } from '../system/system.module';
import { OauthSSOController } from './controller/oauth-sso.controller';
import { OauthModule } from './oauth.module';
import { OauthUc } from './uc/oauth.uc';

@Module({
	imports: [LoggerModule, OauthModule, SystemModule, AuthorizationModule],
	controllers: [OauthSSOController],
	providers: [OauthUc, HydraOauthUc],
})
export class OauthApiModule {}
