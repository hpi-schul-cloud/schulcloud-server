import { DynamicModule, Module } from '@nestjs/common';
import { MongoMemoryDatabaseModule, MongoDatabaseModuleOptions } from '@shared/infra/database';
import { CoreModule } from '@src/core';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { TldrawBoardRepo } from './repo';
import { TldrawWsService } from './service';
import { config } from './config';
import { TldrawWs } from './controller';

const imports = [CoreModule, ConfigModule.forRoot(createConfigModuleOptions(config))];
const providers = [TldrawWs, TldrawBoardRepo, TldrawWsService];
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
