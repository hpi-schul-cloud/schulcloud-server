import { Module } from '@nestjs/common';
import { OauthProviderServiceModule } from '@shared/infra/oauth-provider';
import { OauthProviderController } from './controller/oauth-provider.controller';
import { OauthProviderResponseMapper } from './mapper/oauth-provider-response.mapper';
import { OauthProviderClientCrudUc } from './uc/oauth-provider.client-crud.uc';

@Module({
	imports: [OauthProviderServiceModule],
	providers: [OauthProviderClientCrudUc, OauthProviderResponseMapper],
	controllers: [OauthProviderController],
})
export class OauthProviderModule {}
