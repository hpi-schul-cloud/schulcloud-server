import { Module } from '@nestjs/common';
import { OauthProviderServiceModule } from '@shared/infra/oauth-provider';
import { PseudonymsRepo, TeamsRepo } from '@shared/repo';
import { UserModule } from '@src/modules/user';
import { LoggerModule } from '@src/core/logger';
import { OauthProviderLogoutFlowUc } from '@src/modules/oauth-provider/uc/oauth-provider.logout-flow.uc';
import { AuthorizationModule } from '@src/modules/authorization/authorization.module';
import { OauthProviderUc } from './uc/oauth-provider.uc';
import { OauthProviderLoginFlowUc } from './uc/oauth-provider.login-flow.uc';
import { OauthProviderLoginFlowService } from './service/oauth-provider.login-flow.service';
import { OauthProviderRequestMapper } from './mapper/oauth-provider-request.mapper';
import { IdTokenService } from './service/id-token.service';
import { OauthProviderResponseMapper } from './mapper/oauth-provider-response.mapper';
import { OauthProviderController } from './controller/oauth-provider.controller';
import { OauthProviderConsentFlowUc } from './uc/oauth-provider.consent-flow.uc';
import { OauthProviderClientCrudUc } from './uc/oauth-provider.client-crud.uc';
import { ToolModule } from '@src/modules/tool';

@Module({
	imports: [OauthProviderServiceModule, UserModule, LoggerModule, AuthorizationModule, ToolModule],
	providers: [
		OauthProviderUc,
		OauthProviderClientCrudUc,
		OauthProviderConsentFlowUc,
		OauthProviderLogoutFlowUc,
		OauthProviderLoginFlowUc,
		OauthProviderLoginFlowService,
		OauthProviderResponseMapper,
		OauthProviderRequestMapper,
		IdTokenService,
		PseudonymsRepo,
		TeamsRepo,
	],
	controllers: [OauthProviderController],
})
export class OauthProviderModule {}
