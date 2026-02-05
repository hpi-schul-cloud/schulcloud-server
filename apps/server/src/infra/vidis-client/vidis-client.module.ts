import { EncryptionConfig, EncryptionModule } from '@infra/encryption';
import { DynamicModule, Module } from '@nestjs/common';
import { VidisClientAdapter } from './vidis-client.adapter';

@Module({})
export class VidisClientModule {
	public static register(constructor: new () => EncryptionConfig, configInjectionToken: string): DynamicModule {
		return {
			module: VidisClientModule,
			imports: [EncryptionModule.register(constructor, configInjectionToken)],
			providers: [VidisClientAdapter],
			exports: [VidisClientAdapter],
		};
	}
}
