import { ConsoleWriterModule } from '@infra/console';
import { RabbitMQWrapperModule } from '@infra/rabbitmq';
import { S3ClientModule } from '@infra/s3-client';
import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { MikroOrmModule, MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { Module, NotFoundException } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { initialisePerformanceObserver } from '@shared/common/measure-utils';
import { createConfigModuleOptions, DB_PASSWORD, DB_USERNAME } from '@src/config';
import { CoreModule } from '@src/core';
import { Logger, LoggerModule } from '@src/core/logger';
import { ConsoleModule } from 'nestjs-console';
import { FilesStorageClientModule } from '../files-storage-client';
import { config, TLDRAW_DB_URL, TldrawConfig, tldrawS3Config } from './config';
import { TldrawDrawing } from './entities';
import { TldrawFilesConsole, TldrawMigrationConsole } from './job';
import { TldrawRepo, YMongodb } from './repo';
import { TldrawFilesStorageAdapterService } from './service';
import { TldrawDeleteFilesUc } from './uc';

const defaultMikroOrmOptions: MikroOrmModuleSyncOptions = {
	findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) =>
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		new NotFoundException(`The requested ${entityName}: ${where} has not been found.`),
};

@Module({
	imports: [
		S3ClientModule.register([tldrawS3Config]),
		CoreModule,
		ConsoleModule,
		ConsoleWriterModule,
		RabbitMQWrapperModule,
		FilesStorageClientModule,
		LoggerModule,
		CoreModule,
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
	providers: [
		TldrawRepo,
		YMongodb,
		TldrawFilesConsole,
		TldrawFilesStorageAdapterService,
		TldrawDeleteFilesUc,
		TldrawMigrationConsole,
	],
})
export class TldrawConsoleModule {
	constructor(private readonly logger: Logger, private readonly configService: ConfigService<TldrawConfig, true>) {
		if (this.configService.get('PERFORMANCE_MEASURE_ENABLED') === true) {
			this.logger.setContext('PerformanceObserver');
			initialisePerformanceObserver(this.logger);
		}
	}
}
