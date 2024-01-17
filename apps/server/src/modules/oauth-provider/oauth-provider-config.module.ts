import { Module } from '@nestjs/common';
import OauthProviderConfiguration, { OauthProviderFeatures } from './oauth-provider-config';

@Module({
	providers: [
		{
			provide: OauthProviderFeatures,
			useValue: OauthProviderConfiguration.features,
		},
	],
	exports: [OauthProviderFeatures],
})
export class OauthProviderConfigModule {}
