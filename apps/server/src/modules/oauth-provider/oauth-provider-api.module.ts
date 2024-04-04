import { OauthProviderServiceModule } from '@infra/oauth-provider';
import { AuthorizationModule } from '@modules/authorization';
import { PseudonymModule } from '@modules/pseudonym';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
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
