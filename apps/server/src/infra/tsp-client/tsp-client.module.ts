import { LoggerModule } from '@core/logger';
import { OauthAdapterModule } from '@modules/oauth-adapter';
import { DynamicModule, Module } from '@nestjs/common';
import { EncryptionConfig, EncryptionModule } from '../encryption';
import { TspClientFactory } from './tsp-client-factory';

@Module({})
export class TspClientModule {
	public static register<T extends EncryptionConfig>(constructor: new () => T): DynamicModule {
		return {
			module: TspClientModule,
			imports: [LoggerModule, OauthAdapterModule, EncryptionModule.register(constructor)],
			providers: [TspClientFactory],
			exports: [TspClientFactory],
		};
	}
}
