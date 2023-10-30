import { Module } from '@nestjs/common';
import { OauthProviderServiceModule } from '@shared/infra/oauth-provider/oauth-provider-service.module';
import { LoggerModule } from '@src/core/logger/logger.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { PseudonymModule } from '../pseudonym/pseudonym.module';
import { UserModule } from '../user/user.module';
import { OauthProviderController } from './controller/oauth-provider.controller';
import { OauthProviderResponseMapper } from './mapper/oauth-provider-response.mapper';
import { OauthProviderModule } from './oauth-provider.module';
import { OauthProviderClientCrudUc } from './uc/oauth-provider.client-crud.uc';
import { OauthProviderConsentFlowUc } from './uc/oauth-provider.consent-flow.uc';
import { OauthProviderLoginFlowUc } from './uc/oauth-provider.login-flow.uc';
import { OauthProviderLogoutFlowUc } from './uc/oauth-provider.logout-flow.uc';
import { OauthProviderUc } from './uc/oauth-provider.uc';

@Module({
	imports: [
		OauthProviderServiceModule,
		OauthProviderModule,
		PseudonymModule,
		LoggerModule,
		AuthorizationModule,
		UserModule,
	],
	providers: [
		OauthProviderUc,
		OauthProviderClientCrudUc,
		OauthProviderConsentFlowUc,
		OauthProviderLogoutFlowUc,
		OauthProviderLoginFlowUc,
		OauthProviderResponseMapper,
	],
	controllers: [OauthProviderController],
})
export class OauthProviderApiModule {}
