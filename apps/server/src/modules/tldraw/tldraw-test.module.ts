import { DynamicModule, Module } from '@nestjs/common';
import { User, Course } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { MongoDatabaseModuleOptions } from '@shared/infra/database/mongo-memory-database/types';
import { CoreModule } from '@src/core';
import { LoggerModule } from '@src/core/logger';
import { AuthenticationModule } from '@src/modules/authentication/authentication.module';
import { AuthorizationModule } from '@src/modules/authorization';
import { AuthenticationApiModule } from '../authentication/authentication-api.module';
import { TldrawModule } from './tldraw.module';

const imports = [
	TldrawModule,
	MongoMemoryDatabaseModule.forRoot({ entities: [User, Course] }),
	AuthenticationApiModule,
	AuthorizationModule,
	AuthenticationModule,
	CoreModule,
	LoggerModule,
];
@Module({
	imports,
})
export class TldrawTestModule {
	static forRoot(options?: MongoDatabaseModuleOptions): DynamicModule {
		return {
			module: TldrawTestModule,
			imports: [...imports, MongoMemoryDatabaseModule.forRoot({ ...options })],
		};
	}
}
