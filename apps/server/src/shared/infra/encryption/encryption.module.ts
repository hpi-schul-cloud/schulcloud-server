import { DynamicModule, Module } from '@nestjs/common';
import { SymetricKeyEncryptionService } from './encryption.service';

export interface EncryptionModuleOptions {
	SymmetricCipherKey: string;
}
@Module({})
export class EncryptionModule {
	static forRoot(options: EncryptionModuleOptions): DynamicModule {
		return {
			module: EncryptionModule,
			providers: [
				SymetricKeyEncryptionService,
				{
					provide: 'SYMMETRIC_CIPHER_KEY',
					useValue: options.SymmetricCipherKey,
				},
			],
			exports: [SymetricKeyEncryptionService],
		};
	}
}
