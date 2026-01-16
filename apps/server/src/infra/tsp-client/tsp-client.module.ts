import { LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { EncryptionConfig, EncryptionModule } from '@infra/encryption';
import { OauthAdapterModule } from '@modules/oauth-adapter';
import { DynamicModule, Module } from '@nestjs/common';
import { TSP_CLIENT_CONFIG_TOKEN, TspClientConfig } from './tsp-client-config';
import { TspClientFactory } from './tsp-client-factory';

@Module({})
export class TspClientModule {
	public static register<T extends EncryptionConfig>(
		constructor: new () => T,
		configInjectionToken: string
	): DynamicModule {
		return {
			module: TspClientModule,
			imports: [
				LoggerModule,
				OauthAdapterModule,
				EncryptionModule.register(constructor, configInjectionToken),
				ConfigurationModule.register(TSP_CLIENT_CONFIG_TOKEN, TspClientConfig),
			],
			providers: [TspClientFactory],
			exports: [TspClientFactory],
		};
	}
}
