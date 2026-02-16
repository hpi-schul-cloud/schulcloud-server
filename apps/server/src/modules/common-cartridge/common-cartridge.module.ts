import { LoggerModule } from '@core/logger';
import { BoardsClientModule } from '@infra/boards-client';
import { CardClientModule } from '@infra/cards-client';
import { ColumnClientModule } from '@infra/column-client';
import { CoursesClientModule } from '@infra/courses-client';
import {
	FILE_STORAGE_CLIENT_CONFIG_TOKEN,
	FilesStorageClientModule,
	FileStorageClientConfig,
} from '@infra/files-storage-client';
import { RABBITMQ_CONFIG_TOKEN, RabbitMQConfig } from '@infra/rabbitmq';
import {
	FILES_STORAGE_CLIENT_CONFIG_TOKEN,
	FilesStorageClientModule as FilesMetadataClientModule,
	FilesStorageClientConfig,
} from '@modules/files-storage-client';
import { Module } from '@nestjs/common';
import { API_HOST_CONFIG_TOKEN, ApiHostConfig } from './api-client.config';
import { CardClientModule as OldCardClientModule } from './common-cartridge-client/card-client/card-client.module';
import { LessonClientModule } from './common-cartridge-client/lesson-client/lesson-client.module';
import { CourseRoomsModule } from './common-cartridge-client/room-client';
import { CommonCartridgeExportService, CommonCartridgeImportConsumer, CommonCartridgeProducer } from './service';
import { CommonCartridgeExportMapper } from './service/common-cartridge-export.mapper';
import { CommonCartridgeImportMapper } from './service/common-cartridge-import.mapper';
import { CommonCartridgeUc } from './uc/common-cartridge.uc';

@Module({
	imports: [
		FilesMetadataClientModule.register({
			exchangeConfigConstructor: FilesStorageClientConfig,
			exchangeConfigInjectionToken: FILES_STORAGE_CLIENT_CONFIG_TOKEN,
			configInjectionToken: RABBITMQ_CONFIG_TOKEN,
			configConstructor: RabbitMQConfig,
		}),
		FilesStorageClientModule.register(FILE_STORAGE_CLIENT_CONFIG_TOKEN, FileStorageClientConfig),
		LoggerModule,
		CoursesClientModule.register(API_HOST_CONFIG_TOKEN, ApiHostConfig),
		BoardsClientModule.register(API_HOST_CONFIG_TOKEN, ApiHostConfig),
		CourseRoomsModule.register(API_HOST_CONFIG_TOKEN, ApiHostConfig),
		OldCardClientModule.register(API_HOST_CONFIG_TOKEN, ApiHostConfig),
		LessonClientModule.register(API_HOST_CONFIG_TOKEN, ApiHostConfig),
		ColumnClientModule.register(API_HOST_CONFIG_TOKEN, ApiHostConfig),
		CardClientModule.register(API_HOST_CONFIG_TOKEN, ApiHostConfig),
	],
	providers: [
		CommonCartridgeExportMapper,
		CommonCartridgeImportMapper,
		CommonCartridgeUc,
		CommonCartridgeExportService,
		CommonCartridgeImportConsumer,
		CommonCartridgeProducer,
	],
	exports: [CommonCartridgeUc],
})
export class CommonCartridgeModule {}
