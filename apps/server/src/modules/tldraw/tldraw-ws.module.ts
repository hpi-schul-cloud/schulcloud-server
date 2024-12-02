import { MikroOrmModule } from '@mikro-orm/nestjs';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { initialisePerformanceObserver } from '@shared/common/measure-utils';
import { createConfigModuleOptions, DB_PASSWORD, DB_USERNAME } from '@src/config';
import { CoreModule } from '@src/core';
import { Logger, LoggerModule } from '@src/core/logger';
import { defaultMikroOrmOptions } from '@shared/common/defaultMikroOrmOptions';
import { config, TLDRAW_DB_URL, TldrawConfig } from './config';
import { TldrawWs } from './controller';
import { TldrawDrawing } from './entities';
import { MetricsService } from './metrics';
import { TldrawRedisFactory, TldrawRedisService } from './redis';
import { TldrawBoardRepo, TldrawRepo, YMongodb } from './repo';
import { TldrawWsService } from './service';

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
	providers: [
		TldrawWs,
		TldrawWsService,
		TldrawBoardRepo,
		TldrawRepo,
		YMongodb,
		MetricsService,
		TldrawRedisFactory,
		TldrawRedisService,
	],
})
export class TldrawWsModule {
	constructor(private readonly logger: Logger, private readonly configService: ConfigService<TldrawConfig, true>) {
		if (this.configService.get('PERFORMANCE_MEASURE_ENABLED') === true) {
			this.logger.setContext('PerformanceObserver');
			initialisePerformanceObserver(this.logger);
		}
	}
}
