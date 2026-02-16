import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { HydraAdapter } from './domain/service/hydra.adapter';
import { OauthProviderService } from './domain/service/oauth-provider.service';
import { ConfigurationModule } from '@infra/configuration';
import { OAUTH_PROVIDER_CONFIG_TOKEN, OauthProviderConfig } from './oauth-provider-config';

// Resolves a dependency cycle
@Module({
	imports: [HttpModule, ConfigurationModule.register(OAUTH_PROVIDER_CONFIG_TOKEN, OauthProviderConfig)],
	providers: [
		{
			provide: OauthProviderService,
			useClass: HydraAdapter,
		},
	],
	exports: [OauthProviderService],
})
export class OauthProviderServiceModule {}
