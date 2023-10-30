import { DynamicModule, Module } from '@nestjs/common';
import { ALL_ENTITIES } from '@shared/domain/entity/all-entities';
import { MongoMemoryDatabaseModule } from '@shared/infra/database/mongo-memory-database/mongo-memory-database.module';
import { MongoDatabaseModuleOptions } from '@shared/infra/database/mongo-memory-database/types';
import { RabbitMQWrapperTestModule } from '@shared/infra/rabbitmq/rabbitmq.module';
import { CoreModule } from '@src/core/core.module';
import { LoggerModule } from '@src/core/logger/logger.module';
import { AuthenticationModule } from '../authentication/authentication.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { FileRecord } from './entity/filerecord.entity';
import { FilesStorageApiModule } from './files-storage-api.module';

const imports = [
	FilesStorageApiModule,
	MongoMemoryDatabaseModule.forRoot({ entities: [...ALL_ENTITIES, FileRecord] }),
	RabbitMQWrapperTestModule,
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
