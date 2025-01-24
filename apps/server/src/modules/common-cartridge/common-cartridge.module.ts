import { Configuration } from '@hpi-schul-cloud/commons';
import { CoursesClientModule } from '@infra/courses-client';
import { RabbitMQWrapperModule } from '@infra/rabbitmq';
import { Module } from '@nestjs/common';
import { BoardClientModule } from './common-cartridge-client/board-client';
import { CardClientModule } from './common-cartridge-client/card-client/card-client.module';
import { LessonClientModule } from './common-cartridge-client/lesson-client/lesson-client.module';
import { CourseRoomsModule } from './common-cartridge-client/room-client';
import { CommonCartridgeExportService, CommonCartridgeImportService } from './service';
import { CommonCartridgeExportMapper } from './service/common-cartridge.mapper';
import { CommonCartridgeUc } from './uc/common-cartridge.uc';

@Module({
	imports: [
		RabbitMQWrapperModule,
		CoursesClientModule,
		BoardClientModule.register({
			basePath: `${Configuration.get('API_HOST') as string}/v3/`,
		}),
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
