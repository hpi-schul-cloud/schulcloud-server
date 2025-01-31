import { Configuration } from '@hpi-schul-cloud/commons';
import { FilesStorageClientModule } from '@infra/files-storage-client';
import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@imports-from-feathers';
import { CoursesClientModule } from '@infra/courses-client';
import { RabbitMQWrapperModule } from '@infra/rabbitmq';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { defaultMikroOrmOptions } from '@shared/common/defaultMikroOrmOptions';
import { ALL_ENTITIES } from '@shared/domain/entity';
import { LoggerModule } from '@core/logger';
import { BoardsClientModule } from '@infra/boards-client';
import { CardClientModule } from './common-cartridge-client/card-client/card-client.module';
import { LessonClientModule } from './common-cartridge-client/lesson-client/lesson-client.module';
import { CourseRoomsModule } from './common-cartridge-client/room-client';
import { CommonCartridgeExportService, CommonCartridgeImportService } from './service';
import { CommonCartridgeExportMapper } from './service/common-cartridge.mapper';
import { FilesStorageClientModule as FilesMetadataClientModule } from '../files-storage-client';
import { CommonCartridgeUc } from './uc/common-cartridge.uc';

@Module({
	imports: [
		RabbitMQWrapperModule,
		FilesMetadataClientModule,
		FilesStorageClientModule,
		LoggerModule,
		CoursesClientModule,
		BoardsClientModule,
		MikroOrmModule.forRoot({
			...defaultMikroOrmOptions,
			type: 'mongo',
			clientUrl: DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			entities: ALL_ENTITIES,
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
