import { LegacyLogger, LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { DynamicModule, Module } from '@nestjs/common';
import { EncryptionConfig } from './encryption-config.interface';
import { DefaultEncryptionService } from './encryption.interface';
import { SymmetricKeyEncryptionService } from './encryption.service';

@Module({})
export class EncryptionModule {
	public static register<T extends EncryptionConfig>(constructor: new () => T, token: string): DynamicModule {
		const providers = [
			{
				provide: DefaultEncryptionService,
				useFactory: (config: EncryptionConfig, logger: LegacyLogger) =>
					new SymmetricKeyEncryptionService(logger, config.aesKey),
				inject: [token, LegacyLogger],
			},
		];

		return {
			module: EncryptionModule,
			imports: [LoggerModule, ConfigurationModule.register(token, constructor)],
			providers,
			exports: [DefaultEncryptionService],
		};
	}
}
