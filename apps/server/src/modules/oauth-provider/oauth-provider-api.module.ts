import { AuthorizationModule } from '@modules/authorization';
import { PseudonymModule } from '@modules/pseudonym';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import {
	OauthProviderClientCrudUc,
	OauthProviderConsentFlowUc,
	OauthProviderController,
	OauthProviderLoginFlowUc,
	OauthProviderLogoutFlowUc,
	OauthProviderSessionUc,
} from './api';
import { OauthProviderServiceModule } from './oauth-provider-service.module';
import { OauthProviderModule } from './oauth-provider.module';

@Module({
	imports: [
		OauthProviderModule,
		OauthProviderServiceModule,
		PseudonymModule,
		LoggerModule,
		AuthorizationModule,
		UserModule,
	],
	providers: [
		OauthProviderSessionUc,
		OauthProviderClientCrudUc,
		OauthProviderConsentFlowUc,
		OauthProviderLogoutFlowUc,
		OauthProviderLoginFlowUc,
	],
	controllers: [OauthProviderController],
})
export class OauthProviderApiModule {}
