import { DynamicModule, Module } from '@nestjs/common';
import { MongoMemoryDatabaseModule, MongoDatabaseModuleOptions } from '@shared/infra/database';
import { CoreModule } from '@src/core';
import { LoggerModule } from '@src/core/logger';
import { AuthenticationModule } from '@src/modules/authentication/authentication.module';
import { AuthorizationModule } from '@src/modules/authorization';
import { AuthenticationApiModule } from '../authentication/authentication-api.module';
import { TldrawWsModule } from './tldraw-ws.module';
import { TldrawWs } from './controller';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { TldrawBoardRepo } from './repo';
import { TldrawWsService } from './service';
import { config } from './config';

const imports = [
	TldrawWsModule,
	MongoMemoryDatabaseModule.forRoot({ entities: [User, Course] }),
	AuthenticationApiModule,
	AuthorizationModule,
	AuthenticationModule,
	CoreModule,
	LoggerModule,
];
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
