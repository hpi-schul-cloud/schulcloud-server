import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { OauthSSOController } from './controller/oauth-sso.controller';
import { OauthModule } from './oauth.module';
import { HydraOauthUc } from './uc';

@Module({
	imports: [OauthModule, LoggerModule],
	controllers: [OauthSSOController],
	providers: [HydraOauthUc],
})
export class OauthApiModule {}
