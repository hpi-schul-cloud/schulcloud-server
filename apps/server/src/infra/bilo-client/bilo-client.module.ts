import { LoggerModule } from '@core/logger';
import { EncryptionConfig, EncryptionModule } from '@infra/encryption';
import { OauthAdapterModule } from '@modules/oauth-adapter';
import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
import { BiloMediaClientAdapter } from './bilo-media-client.adapter';

@Module({})
export class BiloClientModule {
	public static register(configInjectionToken: string, configConstructor: new () => EncryptionConfig): DynamicModule {
		return {
			module: BiloClientModule,
			imports: [
				HttpModule,
				EncryptionModule.register(configInjectionToken, configConstructor),
				LoggerModule,
				OauthAdapterModule,
			],
			providers: [BiloMediaClientAdapter],
			exports: [BiloMediaClientAdapter],
		};
	}
}
