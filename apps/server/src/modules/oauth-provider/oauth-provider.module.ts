import { Module } from '@nestjs/common';
import { OauthProviderServiceModule } from '@shared/infra/oauth-provider';
import { OauthProviderUc } from '@src/modules/oauth-provider/uc/oauth-provider.uc';
import { OauthProviderController } from '@src/modules/oauth-provider/controller/oauth-provider.controller';
import { OauthProviderResponseMapper } from '@src/modules/oauth-provider/mapper/oauth-provider-response.mapper';

@Module({
	imports: [OauthProviderServiceModule],
	providers: [OauthProviderUc, OauthProviderResponseMapper],
	controllers: [OauthProviderController],
})
export class OauthProviderModule {}
