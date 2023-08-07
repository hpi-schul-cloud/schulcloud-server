import { Module } from '@nestjs/common';
import { OauthProviderServiceModule } from '@shared/infra/oauth-provider';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '@src/modules/authorization';
import { PseudonymModule } from '@src/modules/pseudonym';
import { UserModule } from '@src/modules/user';
import { OauthProviderController } from './controller/oauth-provider.controller';
import { OauthProviderResponseMapper } from './mapper/oauth-provider-response.mapper';
import { OauthProviderModule } from './oauth-provider.module';
import {
	OauthProviderClientCrudUc,
	OauthProviderConsentFlowUc,
	OauthProviderLoginFlowUc,
	OauthProviderLogoutFlowUc,
	OauthProviderUc,
} from './uc';

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
