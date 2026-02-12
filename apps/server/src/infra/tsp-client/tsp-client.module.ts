import { LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { EncryptionModule } from '@infra/encryption';
import { OauthAdapterModule } from '@modules/oauth-adapter';
import { DynamicModule, Module } from '@nestjs/common';
import { TspClientFactory } from './tsp-client-factory';
import { TspClientModuleOptions } from './types';

@Module({})
export class TspClientModule {
	public static register(options: TspClientModuleOptions): DynamicModule {
		const { encryptionConfig, tspClientConfig } = options;
		return {
			module: TspClientModule,
			imports: [
				LoggerModule,
				OauthAdapterModule,
				EncryptionModule.register(encryptionConfig.configInjectionToken, encryptionConfig.configConstructor),
				ConfigurationModule.register(tspClientConfig.configInjectionToken, tspClientConfig.configConstructor),
			],
			providers: [TspClientFactory],
			exports: [TspClientFactory],
		};
	}
}
