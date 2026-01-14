import { LegacyLogger, LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { DynamicModule, Module } from '@nestjs/common';
import { EncryptionConfig, INTERNAL_ENCRYPTION_CONFIG_TOKEN } from './encryption-config.interface';
import { DefaultEncryptionService } from './encryption.interface';
import { SymmetricKeyEncryptionService } from './encryption.service';

@Module({})
export class EncryptionModule {
	public static register<T extends EncryptionConfig>(constructor: new () => T): DynamicModule {
		const providers = [
			{
				provide: DefaultEncryptionService,
				useFactory: (config: EncryptionConfig, logger: LegacyLogger) =>
					new SymmetricKeyEncryptionService(logger, config.aesKey),
				inject: [INTERNAL_ENCRYPTION_CONFIG_TOKEN, LegacyLogger],
			},
		];

		return {
			module: EncryptionModule,
			imports: [LoggerModule, ConfigurationModule.register(INTERNAL_ENCRYPTION_CONFIG_TOKEN, constructor)],
			providers,
			exports: [DefaultEncryptionService],
		};
	}
}
