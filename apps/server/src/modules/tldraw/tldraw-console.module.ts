import { Module, NotFoundException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions, DB_PASSWORD, DB_USERNAME } from '@src/config';
import { LoggerModule } from '@src/core/logger';
import { MikroOrmModule, MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { RabbitMQWrapperModule } from '@infra/rabbitmq';
import { FilesStorageClientModule } from '../files-storage-client';
import { config, TLDRAW_DB_URL } from './config';
import { TldrawDrawing } from './entities';
import { TldrawFilesStorageAdapterService } from './service';
import { TldrawRepo, YMongodb } from './repo';
import { TldrawFilesConsole } from './job';
import { TldrawDeleteFilesUc } from './uc';

const defaultMikroOrmOptions: MikroOrmModuleSyncOptions = {
	findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) =>
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		new NotFoundException(`The requested ${entityName}: ${where} has not been found.`),
};

@Module({
	imports: [
		RabbitMQWrapperModule,
		FilesStorageClientModule,
		LoggerModule,
		MikroOrmModule.forRoot({
			...defaultMikroOrmOptions,
			type: 'mongo',
			clientUrl: TLDRAW_DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			entities: [TldrawDrawing],
		}),
		ConfigModule.forRoot(createConfigModuleOptions(config)),
	],
	providers: [TldrawRepo, YMongodb, TldrawFilesConsole, TldrawFilesStorageAdapterService, TldrawDeleteFilesUc],
})
export class TldrawConsoleModule {}
