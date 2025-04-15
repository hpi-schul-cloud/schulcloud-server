import { LoggerModule } from '@core/logger';
import { Configuration } from '@hpi-schul-cloud/commons';
import { BoardsClientModule } from '@infra/boards-client';
import { CoursesClientModule } from '@infra/courses-client';
import { FilesStorageClientModule } from '@infra/files-storage-client';
import { RabbitMQWrapperModule } from '@infra/rabbitmq';
import { FilesStorageClientModule as FilesMetadataClientModule } from '@modules/files-storage-client';
import { Module } from '@nestjs/common';
import { CardClientModule as OldCardClientModule } from './common-cartridge-client/card-client/card-client.module';
import { LessonClientModule } from './common-cartridge-client/lesson-client/lesson-client.module';
import { CourseRoomsModule } from './common-cartridge-client/room-client';
import { CommonCartridgeExportService, CommonCartridgeImportService } from './service';
import { CommonCartridgeExportMapper } from './service/common-cartridge-export.mapper';
import { CommonCartridgeUc } from './uc/common-cartridge.uc';
import { ColumnClientModule } from '@infra/column-client';
import { CardClientModule } from '@infra/card-client';

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
		OldCardClientModule.register({
			basePath: `${Configuration.get('API_HOST') as string}/v3/`,
		}),
		LessonClientModule.register({
			basePath: `${Configuration.get('API_HOST') as string}/v3/`,
		}),
		ColumnClientModule,
		CardClientModule,
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
