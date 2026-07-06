import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ConfigurationModule } from '@infra/configuration';
import { LegacyLogger, LoggerModule } from '@infra/logger';
import { RabbitMQModuleOptions, RabbitMQWrapperModule } from '@infra/rabbitmq';
import { SagaModule } from '@modules/saga';
import { DynamicModule, Module } from '@nestjs/common';
import { FilesStorageAMQPClientConfig } from './files-storage-amqp-client-config';
import { FilesStorageClientAdapterService, FilesStorageProducer } from './service';

export type FilesStorageAMQPClientModuleOptions = RabbitMQModuleOptions;
@Module({})
export class FilesStorageAMQPClientModule {
	public static register(options: FilesStorageAMQPClientModuleOptions): DynamicModule {
		const providers = [
			FilesStorageClientAdapterService,
			{
				provide: FilesStorageProducer,
				useFactory: (
					amqpConnection: AmqpConnection,
					logger: LegacyLogger,
					config: FilesStorageAMQPClientConfig
				): FilesStorageProducer => new FilesStorageProducer(amqpConnection, logger, config),
				inject: [AmqpConnection, LegacyLogger, options.exchangeConfigInjectionToken],
			},
		];

		return {
			module: FilesStorageAMQPClientModule,
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
