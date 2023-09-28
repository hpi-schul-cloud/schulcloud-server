import { DynamicModule, Module } from '@nestjs/common';
import { User, Course } from '@shared/domain';
import { MongoMemoryDatabaseModule, MongoDatabaseModuleOptions } from '@shared/infra/database';
import { CoreModule } from '@src/core';
import { LoggerModule } from '@src/core/logger';
import { AuthenticationModule } from '@src/modules/authentication';
import { AuthorizationModule } from '@src/modules/authorization';
import { TldrawModule } from './tldraw.module';

const imports = [
	TldrawModule,
	MongoMemoryDatabaseModule.forRoot({ entities: [User, Course] }),
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
