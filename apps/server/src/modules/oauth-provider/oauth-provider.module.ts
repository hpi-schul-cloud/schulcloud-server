import { Module } from '@nestjs/common';
import { OauthProviderServiceModule } from '@shared/infra/oauth-provider';
import { OauthProviderController } from '@src/modules/oauth-provider/controller/oauth-provider.controller';
import { OauthProviderResponseMapper } from '@src/modules/oauth-provider/mapper/oauth-provider-response.mapper';
import { OauthProviderLogoutFlowUc } from '@src/modules/oauth-provider/uc/oauth-provider.logout-flow.uc';
import { AuthorizationModule } from '@src/modules/authorization/authorization.module';
import { OauthProviderUc } from '@src/modules/oauth-provider/uc/oauth-provider.uc';
import { OauthProviderClientCrudUc } from './uc/oauth-provider.client-crud.uc';

@Module({
	imports: [OauthProviderServiceModule, AuthorizationModule],
	providers: [OauthProviderClientCrudUc, OauthProviderUc, OauthProviderLogoutFlowUc, OauthProviderResponseMapper],
	controllers: [OauthProviderController],
})
export class OauthProviderModule {}
