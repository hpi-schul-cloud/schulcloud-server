import { DynamicModule, Module } from '@nestjs/common';

import { MongoDatabaseModuleOptions, MongoMemoryDatabaseModule } from '@infra/database';
import { RabbitMQWrapperTestModule } from '@infra/rabbitmq';
import { ALL_ENTITIES } from '@shared/domain/entity';
import { CoreModule } from '@src/core';
import { LoggerModule } from '@src/core/logger';
import { FileRecord } from './entity';
import { FilesStorageApiModule } from './files-storage-api.module';

const imports = [
	FilesStorageApiModule,
	MongoMemoryDatabaseModule.forRoot({ entities: [...ALL_ENTITIES, FileRecord] }),
	RabbitMQWrapperTestModule,
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
export class FilesStorageTestModule {
	static forRoot(options?: MongoDatabaseModuleOptions): DynamicModule {
		return {
			module: FilesStorageTestModule,
			imports: [...imports, MongoMemoryDatabaseModule.forRoot({ ...options })],
			controllers,
			providers,
		};
	}
}
