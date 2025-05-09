import { Module } from '@nestjs/common';
import { OAuthController, OAuthUc } from './api';
import { OauthModule } from './oauth.module';

@Module({
	imports: [OauthModule],
	controllers: [OAuthController],
	providers: [OAuthUc],
})
export class OAuthApiModule {}
