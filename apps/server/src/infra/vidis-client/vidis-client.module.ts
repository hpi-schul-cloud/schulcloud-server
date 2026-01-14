import { EncryptionConfig, EncryptionModule } from '@infra/encryption';
import { DynamicModule, Module } from '@nestjs/common';
import { VidisClientAdapter } from './vidis-client.adapter';

@Module({})
export class VidisClientModule {
	public static register<T extends EncryptionConfig>(constructor: new () => T, token: string): DynamicModule {
		return {
			module: VidisClientModule,
			imports: [EncryptionModule.register(constructor, token)],
			providers: [VidisClientAdapter],
			exports: [VidisClientAdapter],
		};
	}
}
