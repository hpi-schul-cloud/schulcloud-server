import { LoggerModule } from '@core/logger';
import { EncryptionConfig, EncryptionModule } from '@infra/encryption';
import { OauthAdapterModule } from '@modules/oauth-adapter';
import { DynamicModule, Module } from '@nestjs/common';
import { TspClientFactory } from './tsp-client-factory';

@Module({})
export class TspClientModule {
	public static register<T extends EncryptionConfig>(
		constructor: new () => T,
		configInjectionToken: string
	): DynamicModule {
		return {
			module: TspClientModule,
			imports: [LoggerModule, OauthAdapterModule, EncryptionModule.register(constructor, configInjectionToken)],
			providers: [TspClientFactory],
			exports: [TspClientFactory],
		};
	}
}
