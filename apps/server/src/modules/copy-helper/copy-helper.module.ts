import {
	FILES_STORAGE_AMQP_CLIENT_CONFIG_TOKEN,
	FilesStorageAMQPClientConfig,
	FilesStorageAMQPClientModule,
} from '@infra/files-storage-amqp-client';
import { RABBITMQ_CONFIG_TOKEN, RabbitMQConfig } from '@infra/rabbitmq';
import { Module } from '@nestjs/common';
import { CopyFilesService } from './service/copy-files.service';
import { CopyHelperService } from './service/copy-helper.service';

@Module({
	imports: [
		FilesStorageAMQPClientModule.register({
			exchangeConfigConstructor: FilesStorageAMQPClientConfig,
			exchangeConfigInjectionToken: FILES_STORAGE_AMQP_CLIENT_CONFIG_TOKEN,
			configInjectionToken: RABBITMQ_CONFIG_TOKEN,
			configConstructor: RabbitMQConfig,
		}),
	],
	providers: [CopyHelperService, CopyFilesService],
	exports: [CopyHelperService, CopyFilesService],
})
export class CopyHelperModule {}
