import { Configuration } from '@hpi-schul-cloud/commons';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { FilesStorageClientModule } from '@modules/files-storage-client';
import { Module } from '@nestjs/common';
import { ALL_ENTITIES } from '@shared/domain/entity';
import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@src/config';
import { RabbitMQWrapperModule } from '@src/infra/rabbitmq';
import { defaultMikroOrmOptions } from '../server';
import { BoardClientModule } from './common-cartridge-client/board-client';
import { CoursesClientModule } from './common-cartridge-client/course-client';
import { CommonCartridgeExportService } from './service/common-cartridge-export.service';
import { CommonCartridgeUc } from './uc/common-cartridge.uc';

@Module({
	imports: [
		RabbitMQWrapperModule,
		CoursesClientModule.register({
			basePath: `${Configuration.get('API_HOST') as string}/v3/`,
		}),
		FilesStorageClientModule,
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
	],
	providers: [CommonCartridgeUc, CommonCartridgeExportService],
	exports: [CommonCartridgeUc],
})
export class CommonCartridgeModule {}
