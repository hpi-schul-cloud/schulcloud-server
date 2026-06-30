import { RABBITMQ_CONFIG_TOKEN, RabbitMQConfig } from '@infra/rabbitmq';
import {
	FILES_STORAGE_CLIENT_CONFIG_TOKEN,
	FilesStorageClientConfig,
	FilesStorageClientModule,
} from '@modules/files-storage-client';
import { Module } from '@nestjs/common';
import { CopyFilesService } from './service/copy-files.service';
import { CopyHelperService } from './service/copy-helper.service';

@Module({
	imports: [
		FilesStorageClientModule.register({
			exchangeConfigConstructor: FilesStorageClientConfig,
			exchangeConfigInjectionToken: FILES_STORAGE_CLIENT_CONFIG_TOKEN,
			configInjectionToken: RABBITMQ_CONFIG_TOKEN,
			configConstructor: RabbitMQConfig,
		}),
	],
	providers: [CopyHelperService, CopyFilesService],
	exports: [CopyHelperService, CopyFilesService],
})
export class CopyHelperModule {}
