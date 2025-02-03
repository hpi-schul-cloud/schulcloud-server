import { LoggerModule } from '@core/logger';
import { Configuration } from '@hpi-schul-cloud/commons';
import { BoardsClientModule } from '@infra/boards-client';
import { CoursesClientModule } from '@infra/courses-client';
import { FilesStorageClientModule } from '@infra/files-storage-client';
import { RabbitMQWrapperModule } from '@infra/rabbitmq';
import { Module } from '@nestjs/common';
import { FilesStorageClientModule as FilesMetadataClientModule } from '../files-storage-client';
import { CardClientModule } from './common-cartridge-client/card-client/card-client.module';
import { LessonClientModule } from './common-cartridge-client/lesson-client/lesson-client.module';
import { CourseRoomsModule } from './common-cartridge-client/room-client';
import { CommonCartridgeExportService, CommonCartridgeImportService } from './service';
import { CommonCartridgeExportMapper } from './service/common-cartridge.mapper';
import { CommonCartridgeUc } from './uc/common-cartridge.uc';

@Module({
	imports: [
		RabbitMQWrapperModule,
		FilesMetadataClientModule,
		FilesStorageClientModule,
		LoggerModule,
		CoursesClientModule,
		BoardsClientModule,
		CourseRoomsModule.register({
			basePath: `${Configuration.get('API_HOST') as string}/v3/`,
		}),
		CardClientModule.register({
			basePath: `${Configuration.get('API_HOST') as string}/v3/`,
		}),
		LessonClientModule.register({
			basePath: `${Configuration.get('API_HOST') as string}/v3/`,
		}),
	],
	providers: [
		CommonCartridgeExportMapper,
		CommonCartridgeUc,
		CommonCartridgeExportService,
		CommonCartridgeImportService,
	],
	exports: [CommonCartridgeUc],
})
export class CommonCartridgeModule {}
