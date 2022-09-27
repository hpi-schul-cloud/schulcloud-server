import { Module } from '@nestjs/common';
import { OauthProviderServiceModule } from '@shared/infra/oauth-provider';
import { OauthProviderController } from '@src/modules/oauth-provider/controller/oauth-provider.controller';
import { OauthProviderResponseMapper } from '@src/modules/oauth-provider/mapper/oauth-provider-response.mapper';
import { OauthProviderConsentFlowUc } from '@src/modules/oauth-provider/uc/oauth-provider.consent-flow.uc';
import { IdTokenService } from '@src/modules/oauth-provider/service/id-token.service';
import { LtiToolRepo, PseudonymsRepo, TeamsRepo } from '@shared/repo';
import { UserModule } from '@src/modules/user';
import { LoggerModule } from '@src/core/logger';
import { OauthProviderLogoutFlowUc } from '@src/modules/oauth-provider/uc/oauth-provider.logout-flow.uc';
import { AuthorizationModule } from '@src/modules/authorization/authorization.module';
import { OauthProviderUc } from '@src/modules/oauth-provider/uc/oauth-provider.uc';
import { OauthProviderClientCrudUc } from './uc/oauth-provider.client-crud.uc';

@Module({
	imports: [OauthProviderServiceModule, UserModule, LoggerModule, AuthorizationModule],
	providers: [
		OauthProviderUc,
		OauthProviderClientCrudUc,
		OauthProviderConsentFlowUc,
		OauthProviderLogoutFlowUc,
		OauthProviderResponseMapper,
		IdTokenService,
		PseudonymsRepo,
		LtiToolRepo,
		TeamsRepo,
	],
	controllers: [OauthProviderController],
})
export class OauthProviderModule {}
