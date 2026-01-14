import { LoggerModule } from '@core/logger';
import { EncryptionConfig, EncryptionModule } from '@infra/encryption';
import { OauthAdapterModule } from '@modules/oauth-adapter';
import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
import { BiloMediaClientAdapter } from './bilo-media-client.adapter';

@Module({})
export class BiloClientModule {
	public static register<T extends EncryptionConfig>(constructor: new () => T, token: string): DynamicModule {
		return {
			module: BiloClientModule,
			imports: [HttpModule, EncryptionModule.register(constructor, token), LoggerModule, OauthAdapterModule],
			providers: [BiloMediaClientAdapter],
			exports: [BiloMediaClientAdapter],
		};
	}
}
