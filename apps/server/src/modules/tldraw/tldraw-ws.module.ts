import { Module, NotFoundException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions, DB_PASSWORD, DB_USERNAME } from '@src/config';
import { CoreModule } from '@src/core';
import { LoggerModule } from '@src/core/logger';
import { MikroOrmModule, MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { HttpModule } from '@nestjs/axios';
import { TldrawDrawing } from './entities';
import { MetricsService } from './metrics';
import { TldrawBoardRepo, TldrawRepo, YMongodb } from './repo';
import { TldrawWsService } from './service';
import { TldrawWs } from './controller';
import { config, TLDRAW_DB_URL } from './config';
import { TldrawRedisFactory } from './redis';

const defaultMikroOrmOptions: MikroOrmModuleSyncOptions = {
	findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) =>
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		new NotFoundException(`The requested ${entityName}: ${where} has not been found.`),
};
@Module({
	imports: [
		HttpModule,
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
	providers: [TldrawWs, TldrawWsService, TldrawBoardRepo, TldrawRepo, YMongodb, MetricsService, TldrawRedisFactory],
})
export class TldrawWsModule {}
