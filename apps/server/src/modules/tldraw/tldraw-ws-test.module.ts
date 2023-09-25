import { DynamicModule, Module } from '@nestjs/common';
import { User, Course } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { MongoDatabaseModuleOptions } from '@shared/infra/database/mongo-memory-database/types';
import { CoreModule } from '@src/core';
import { LoggerModule } from '@src/core/logger';
import { AuthenticationModule } from '@src/modules/authentication';
import { AuthorizationModule } from '@src/modules/authorization';
import { AuthenticationApiModule } from '../authentication/authentication-api.module';
import { TldrawWsModule } from './tldraw-ws.module';

const imports = [
	TldrawWsModule,
	MongoMemoryDatabaseModule.forRoot({ entities: [User, Course] }),
	AuthorizationModule,
	AuthenticationModule,
	CoreModule,
	LoggerModule,
];
@Module({
	imports,
})
export class TldrawWsTestModule {
	static forRoot(options?: MongoDatabaseModuleOptions): DynamicModule {
		return {
			module: TldrawWsTestModule,
			imports: [...imports, MongoMemoryDatabaseModule.forRoot({ ...options })],
		};
	}
}
