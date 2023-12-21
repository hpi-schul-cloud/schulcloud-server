import { DynamicModule, Module } from '@nestjs/common';
import { MongoMemoryDatabaseModule, MongoDatabaseModuleOptions } from '@infra/database';
import { Logger, LoggerModule } from '@src/core/logger';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { RedisModule } from '@infra/redis';
import { defaultMikroOrmOptions } from '@modules/server';
import { HttpModule } from '@nestjs/axios';
import { config } from './config';
import { TldrawController } from './controller/tldraw.controller';
import { TldrawService } from './service/tldraw.service';
import { TldrawRepo } from './repo/tldraw.repo';

const imports = [
	MongoMemoryDatabaseModule.forRoot({ ...defaultMikroOrmOptions }),
	LoggerModule,
	ConfigModule.forRoot(createConfigModuleOptions(config)),
	RedisModule,
	HttpModule,
];
const providers = [Logger, TldrawService, TldrawRepo];
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
