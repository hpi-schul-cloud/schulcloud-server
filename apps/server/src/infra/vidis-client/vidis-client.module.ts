import { EncryptionConfig, EncryptionModule } from '@infra/encryption';
import { DynamicModule, Module } from '@nestjs/common';
import { VidisClientAdapter } from './vidis-client.adapter';

@Module({})
export class VidisClientModule {
	public static register(configInjectionToken: string, configConstructor: new () => EncryptionConfig): DynamicModule {
		return {
			module: VidisClientModule,
			imports: [EncryptionModule.register(configInjectionToken, configConstructor)],
			providers: [VidisClientAdapter],
			exports: [VidisClientAdapter],
		};
	}
}
