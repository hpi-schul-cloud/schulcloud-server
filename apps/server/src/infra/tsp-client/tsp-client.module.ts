import { LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { OauthAdapterModule } from '@modules/oauth-adapter';
import { Module } from '@nestjs/common';
import { EncryptionModule } from '../encryption';
import { TSP_CLIENT_CONFIG_TOKEN, TspClientConfig } from './tsp-client-config';
import { TspClientFactory } from './tsp-client-factory';

@Module({
	imports: [
		ConfigurationModule.register(TSP_CLIENT_CONFIG_TOKEN, TspClientConfig),
		EncryptionModule,
		LoggerModule,
		OauthAdapterModule,
	],
	providers: [TspClientFactory],
	exports: [TspClientFactory],
})
export class TspClientModule {}
