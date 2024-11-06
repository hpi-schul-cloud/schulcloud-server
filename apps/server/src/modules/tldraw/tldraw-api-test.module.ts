import { MongoDatabaseModuleOptions, MongoMemoryDatabaseModule } from '@infra/database';
import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { CoreModule } from '@src/core';
import { LoggerModule } from '@src/core/logger';
import { AuthGuardModule, AuthGuardOptions } from '@src/infra/auth-guard';
import { config } from './config';
import { TldrawController } from './controller';
import { TldrawDrawing } from './entities';
import { TldrawBoardRepo, TldrawRepo, YMongodb } from './repo';
import { TldrawService } from './service';

const imports = [
	MongoMemoryDatabaseModule.forRoot({ entities: [TldrawDrawing] }),
	LoggerModule,
	ConfigModule.forRoot(createConfigModuleOptions(config)),
	HttpModule,
	AuthGuardModule.register([AuthGuardOptions.X_API_KEY]),
	CoreModule,
];
const providers = [TldrawService, TldrawBoardRepo, TldrawRepo, YMongodb];
@Module({
	imports,
	providers,
})
export class TldrawApiTestModule {
	static forRoot(options?: MongoDatabaseModuleOptions): DynamicModule {
		return {
			module: TldrawApiTestModule,
			imports: [...imports, MongoMemoryDatabaseModule.forRoot({ ...options })],
			controllers: [TldrawController],
			providers,
		};
	}
}
