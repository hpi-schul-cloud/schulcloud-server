import { MongoDatabaseModuleOptions, MongoMemoryDatabaseModule } from '@infra/database';
import { defaultMikroOrmOptions } from '@modules/server';
import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { Logger, LoggerModule } from '@src/core/logger';
import { config } from './config';
import { TldrawController } from './controller/tldraw.controller';
import { MetricsService } from './metrics';
import { TldrawRepo } from './repo/tldraw.repo';
import { TldrawService } from './service/tldraw.service';
import { TldrawRedisFactory } from './redis';

const imports = [
	MongoMemoryDatabaseModule.forRoot({ ...defaultMikroOrmOptions }),
	LoggerModule,
	ConfigModule.forRoot(createConfigModuleOptions(config)),
	HttpModule,
];
const providers = [Logger, TldrawService, TldrawRepo, MetricsService, TldrawRedisFactory];
@Module({
	imports,
	providers,
})
export class TldrawTestModule {
	static forRoot(options?: MongoDatabaseModuleOptions): DynamicModule {
		return {
			module: TldrawTestModule,
			imports: [...imports, MongoMemoryDatabaseModule.forRoot({ ...defaultMikroOrmOptions, ...options })],
			controllers: [TldrawController],
			providers,
		};
	}
}
