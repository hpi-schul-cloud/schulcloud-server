import { DynamicModule, Module } from '@nestjs/common';
import { MongoMemoryDatabaseModule, MongoDatabaseModuleOptions } from '@infra/database';
import { CoreModule } from '@src/core';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { LoggerModule } from '@src/core/logger';
import { MetricsService } from './metrics';
import { TldrawBoardRepo, TldrawRepo, YMongodb } from './repo';
import { TldrawWsService } from './service';
import { config } from './config';
import { TldrawWs } from './controller';
import { TldrawDrawing } from './entities';

const imports = [
	LoggerModule,
	CoreModule,
	MongoMemoryDatabaseModule.forRoot({ entities: [TldrawDrawing] }),
	ConfigModule.forRoot(createConfigModuleOptions(config)),
];
const providers = [TldrawWs, TldrawWsService, TldrawBoardRepo, TldrawRepo, YMongodb, MetricsService];
@Module({
	imports,
	providers,
})
export class TldrawWsTestModule {
	static forRoot(options?: MongoDatabaseModuleOptions): DynamicModule {
		return {
			module: TldrawWsTestModule,
			imports: [...imports, MongoMemoryDatabaseModule.forRoot({ ...options })],
			providers,
		};
	}
}
