import { Configuration } from '@hpi-schul-cloud/commons';
import { FilesStorageRestClientModule } from '@infra/files-storage-client';
import { RabbitMQWrapperModule } from '@infra/rabbitmq';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { FilesStorageClientModule } from '@modules/files-storage-client';
import { Module } from '@nestjs/common';
import { ALL_ENTITIES } from '@shared/domain/entity';
import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@src/config';
import { defaultMikroOrmOptions } from '../server';
import { BoardClientModule } from './common-cartridge-client/board-client';
import { CardClientModule } from './common-cartridge-client/card-client/card-client.module';
import { CoursesClientModule } from './common-cartridge-client/course-client';
import { LessonClientModule } from './common-cartridge-client/lesson-client/lesson-client.module';
import { CourseRoomsModule } from './common-cartridge-client/room-client';
import { CommonCartridgeExportService } from './service/common-cartridge-export.service';
import { CommonCartridgeUc } from './uc/common-cartridge.uc';

@Module({
	imports: [
		RabbitMQWrapperModule,
		FilesStorageClientModule,
		FilesStorageRestClientModule,
		MikroOrmModule.forRoot({
			...defaultMikroOrmOptions,
			type: 'mongo',
			clientUrl: DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			entities: ALL_ENTITIES,
		}),
		BoardClientModule.register({
			basePath: `${Configuration.get('API_HOST') as string}/v3/`,
		}),
		CourseRoomsModule.register({
			basePath: `${Configuration.get('API_HOST') as string}/v3/`,
		}),

		CardClientModule.register({
			basePath: `${Configuration.get('API_HOST') as string}/v3/`,
		}),
		CoursesClientModule.register({
			basePath: `${Configuration.get('API_HOST') as string}/v3/`,
		}),
		LessonClientModule.register({
			basePath: `${Configuration.get('API_HOST') as string}/v3/`,
		}),
	],
	providers: [CommonCartridgeUc, CommonCartridgeExportService],
	exports: [CommonCartridgeUc],
})
export class CommonCartridgeModule {}
