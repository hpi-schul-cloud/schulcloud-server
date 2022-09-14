import { Module } from '@nestjs/common';
import { OauthProviderServiceModule } from '@shared/infra/oauth-provider';
import { OauthProviderUc } from '@src/modules/oauth-provider/uc/oauth-provider.uc';
import { OauthProviderController } from '@src/modules/oauth-provider/controller/oauth-provider.controller';

@Module({
	imports: [OauthProviderServiceModule],
	providers: [OauthProviderUc],
	controllers: [OauthProviderController],
})
export class OauthProviderModule {}
