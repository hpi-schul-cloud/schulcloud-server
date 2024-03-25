import { DynamicModule, Module } from '@nestjs/common';

import { MongoDatabaseModuleOptions, MongoMemoryDatabaseModule } from '@infra/database';
import { AuthenticationModule } from '@modules/authentication';
import { AuthorizationModule } from '@modules/authorization';
import { ALL_ENTITIES } from '@shared/domain/entity';
import { CoreModule } from '@src/core';
import { LoggerModule } from '@src/core/logger';

const imports = [
	MongoMemoryDatabaseModule.forRoot({ entities: ALL_ENTITIES }),
	AuthorizationModule,
	AuthenticationModule,
	CoreModule,
	LoggerModule,
];
const controllers = [];
const providers = [];
@Module({
	imports,
	controllers,
	providers,
})
export class EduSharingTestModule {
	static forRoot(options?: MongoDatabaseModuleOptions): DynamicModule {
		return {
			module: EduSharingTestModule,
			imports: [...imports, MongoMemoryDatabaseModule.forRoot({ ...options })],
			controllers,
			providers,
		};
	}
}
