import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { HydraAdapter } from './domain/service/hydra.adapter';
import { OauthProviderService } from './domain/service/oauth-provider.service';
import { OauthProviderConfigModule } from './oauth-provider-config.module';

// Resolves a dependency cycle
@Module({
	imports: [HttpModule, OauthProviderConfigModule],
	providers: [
		{
			provide: OauthProviderService,
			useClass: HydraAdapter,
		},
	],
	exports: [OauthProviderService],
})
export class OauthProviderServiceModule {}
