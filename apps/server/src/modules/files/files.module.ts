import {
	FILES_STORAGE_AMQP_CLIENT_CONFIG_TOKEN,
	FilesStorageAMQPClientConfig,
	FilesStorageAMQPClientModule,
} from '@infra/files-storage-amqp-client';
import { LoggerModule } from '@infra/logger';
import { RABBITMQ_CONFIG_TOKEN, RabbitMQConfig } from '@infra/rabbitmq';
import { SagaModule } from '@modules/saga';
import { StorageProviderRepo } from '@modules/school/repo';
import { Module } from '@nestjs/common';
import { FilesRepo } from './repo';
import { DeleteUserFilesDataStep, DeleteUserFilesStorageDataStep } from './saga';

@Module({
	imports: [
		LoggerModule,
		SagaModule,
		FilesStorageAMQPClientModule.register({
			exchangeConfigConstructor: FilesStorageAMQPClientConfig,
			exchangeConfigInjectionToken: FILES_STORAGE_AMQP_CLIENT_CONFIG_TOKEN,
			configInjectionToken: RABBITMQ_CONFIG_TOKEN,
			configConstructor: RabbitMQConfig,
		}),
	],
	providers: [FilesRepo, StorageProviderRepo, DeleteUserFilesDataStep, DeleteUserFilesStorageDataStep],
	exports: [],
})
export class FilesModule {}
