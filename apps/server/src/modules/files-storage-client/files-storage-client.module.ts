import { LegacyLogger, LoggerModule } from '@core/logger';
import { DynamicModule, Module } from '@nestjs/common';
// The files-storage-client should not know the copy-helper
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ConfigurationModule } from '@infra/configuration';
import { RabbitMQWrapperModule } from '@infra/rabbitmq';
import { CopyHelperModule } from '@modules/copy-helper/copy-helper.module';
import { SagaModule } from '@modules/saga';
import { FilesStorageClientConfig } from './files-storage-client-config';
import { FilesStorageModuleOptions } from './files-storage-module.options';
import { DeleteUserFilesStorageDataStep } from './saga';
import { CopyFilesService, FilesStorageClientAdapterService, FilesStorageProducer } from './service';

@Module({})
export class FilesStorageClientModule {
	public static register(options: FilesStorageModuleOptions): DynamicModule {
		const providers = [
			FilesStorageClientAdapterService,
			CopyFilesService,
			DeleteUserFilesStorageDataStep,
			{
				provide: FilesStorageProducer,
				useFactory: (
					amqpConnection: AmqpConnection,
					logger: LegacyLogger,
					config: FilesStorageClientConfig
				): FilesStorageProducer => new FilesStorageProducer(amqpConnection, logger, config),
				inject: [AmqpConnection, LegacyLogger, options.configInjectionToken],
			},
		];

		return {
			module: FilesStorageClientModule,
			imports: [
				LoggerModule,
				CopyHelperModule,
				SagaModule,
				ConfigurationModule.register(options.configInjectionToken, options.configConstructor),
				RabbitMQWrapperModule.register(options),
			],
			providers,
			exports: [FilesStorageClientAdapterService, CopyFilesService],
		};
	}
}
