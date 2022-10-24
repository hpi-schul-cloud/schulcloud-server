import { DynamicModule, Module } from '@nestjs/common';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { MongoDatabaseModuleOptions } from '@shared/infra/database/mongo-memory-database/types';
import { RabbitMQWrapperTestModule } from '@shared/infra/rabbitmq/rabbitmq.module';
import { CoreModule } from '@src/core';
import { LoggerModule } from '@src/core/logger';
import { AuthModule } from '@src/modules/authentication';
import { AuthorizationModule } from '@src/modules/authorization';
import { FileSecurityController } from './controller/file-security.controller';
import { FilesStorageConsumer } from './controller/files-storage.consumer';
import { FilesStorageController } from './controller/files-storage.controller';
import { FilesStorageModule } from './files-storage.module';

const imports = [
	FilesStorageModule,
	MongoMemoryDatabaseModule.forRoot(),
	RabbitMQWrapperTestModule,
	AuthorizationModule,
	AuthModule,
	CoreModule,
	LoggerModule,
];
const controllers = [FilesStorageController, FileSecurityController];
const providers = [FilesStorageConsumer];
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
