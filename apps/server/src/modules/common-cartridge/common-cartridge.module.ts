import { Configuration } from '@hpi-schul-cloud/commons';
import { CoursesClientModule } from '@infra/courses-client';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { defaultMikroOrmOptions } from '@shared/common/defaultMikroOrmOptions';
import { ALL_ENTITIES } from '@shared/domain/entity';
import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@src/imports-from-feathers';
import { RabbitMQWrapperModule } from '@src/infra/rabbitmq';
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
