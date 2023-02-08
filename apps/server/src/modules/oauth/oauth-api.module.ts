import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { SystemModule } from '@src/modules/system';
import { UserModule } from '@src/modules/user';
import { AuthorizationModule } from '../authorization';
import { OauthSSOController } from './controller/oauth-sso.controller';
import { OauthModule } from './oauth.module';
import { HydraOauthUc, OauthUc } from './uc';

@Module({
	imports: [OauthModule, AuthorizationModule, SystemModule, UserModule, LoggerModule],
	controllers: [OauthSSOController],
	providers: [OauthUc, HydraOauthUc],
})
export class OauthApiModule {}
