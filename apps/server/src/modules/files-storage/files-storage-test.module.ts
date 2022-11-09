import { DynamicModule, Module } from '@nestjs/common';
import { ALL_ENTITIES } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { MongoDatabaseModuleOptions } from '@shared/infra/database/mongo-memory-database/types';
import { RabbitMQWrapperTestModule } from '@shared/infra/rabbitmq/rabbitmq.module';
import { CoreModule } from '@src/core';
import { LoggerModule } from '@src/core/logger';
import { AuthModule } from '@src/modules/authentication';
import { AuthorizationModule } from '@src/modules/authorization';
import { FileRecord } from './entity';
import { FilesStorageApiModule } from './files-storage-api.module';

const imports = [
	FilesStorageApiModule,
	MongoMemoryDatabaseModule.forRoot({ entities: [...ALL_ENTITIES, FileRecord] }),
	RabbitMQWrapperTestModule,
	AuthorizationModule,
	AuthModule,
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
