import { ConfigurationModule } from '@infra/configuration';
import { Module } from '@nestjs/common';
import { OAuthController, OAuthUc } from './api';
import { OAUTH_PUBLIC_API_CONFIG_TOKEN, OauthPublicApiConfig } from './oauth.config';
import { OauthModule } from './oauth.module';

@Module({
	imports: [OauthModule, ConfigurationModule.register(OAUTH_PUBLIC_API_CONFIG_TOKEN, OauthPublicApiConfig)],
	controllers: [OAuthController],
	providers: [OAuthUc],
})
export class OAuthApiModule {}
