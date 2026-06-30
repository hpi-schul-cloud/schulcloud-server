import { LegacyLogger, LoggerModule } from '@core/logger';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ConfigurationModule } from '@infra/configuration';
import { RabbitMQWrapperModule } from '@infra/rabbitmq';
import { SagaModule } from '@modules/saga';
import { DynamicModule, Module } from '@nestjs/common';
import { FilesStorageClientConfig } from './files-storage-client-config';
import { FilesStorageModuleOptions } from './files-storage-module.options';
import { DeleteUserFilesStorageDataStep } from './saga';
import { FilesStorageClientAdapterService, FilesStorageProducer } from './service';

@Module({})
export class FilesStorageClientModule {
	public static register(options: FilesStorageModuleOptions): DynamicModule {
		const providers = [
			FilesStorageClientAdapterService,
			DeleteUserFilesStorageDataStep,
			{
				provide: FilesStorageProducer,
				useFactory: (
					amqpConnection: AmqpConnection,
					logger: LegacyLogger,
					config: FilesStorageClientConfig
				): FilesStorageProducer => new FilesStorageProducer(amqpConnection, logger, config),
				inject: [AmqpConnection, LegacyLogger, options.exchangeConfigInjectionToken],
			},
		];

		return {
			module: FilesStorageClientModule,
			imports: [
				LoggerModule,
				SagaModule,
				ConfigurationModule.register(options.configInjectionToken, options.configConstructor),
				ConfigurationModule.register(options.exchangeConfigInjectionToken, options.exchangeConfigConstructor),
				RabbitMQWrapperModule.register(options),
			],
			providers,
			exports: [FilesStorageClientAdapterService],
		};
	}
}
