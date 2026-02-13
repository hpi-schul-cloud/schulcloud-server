import { CoreModule } from '@core/core.module';
import { Configuration } from '@hpi-schul-cloud/commons';
import { BoardsClientModule } from '@infra/boards-client';
import { CardClientModule } from '@infra/cards-client';
import { ColumnClientModule } from '@infra/column-client';
import { CoursesClientModule } from '@infra/courses-client';
import { FilesStorageClientModule } from '@infra/files-storage-client';
import { RabbitMQWrapperModule } from '@infra/rabbitmq';
import { FilesStorageClientModule as FilesMetadataClientModule } from '@modules/files-storage-client';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CardClientModule as OldCardClientModule } from './common-cartridge-client/card-client/card-client.module';
import { LessonClientModule } from './common-cartridge-client/lesson-client/lesson-client.module';
import { CourseRoomsModule } from './common-cartridge-client/room-client';
import { CommonCartridgeExportService, CommonCartridgeImportConsumer, CommonCartridgeProducer } from './service';
import { CommonCartridgeExportMapper } from './service/common-cartridge-export.mapper';
import { CommonCartridgeImportMapper } from './service/common-cartridge-import.mapper';
import { CommonCartridgeUc } from './uc/common-cartridge.uc';

@Module({
	imports: [
		RabbitMQWrapperModule,
		FilesMetadataClientModule,
		FilesStorageClientModule,
		CoreModule,
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
		HttpModule,
		CqrsModule,
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
