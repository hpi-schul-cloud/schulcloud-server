import { CoreModule } from '@core/core.module';
import { LoggerModule } from '@core/logger';
import { MongoDatabaseModuleOptions, MongoMemoryDatabaseModule } from '@infra/database';
import { RabbitMQWrapperTestModule } from '@infra/rabbitmq';
import { DynamicModule, Module } from '@nestjs/common';
import { defaultMikroOrmOptions } from '@shared/common/defaultMikroOrmOptions';
import { ALL_ENTITIES } from '@shared/domain/entity';
import { FileRecord } from './entity';
import { FilesStorageApiModule } from './files-storage-api.app.module';

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
			imports: [...imports, MongoMemoryDatabaseModule.forRoot({ ...defaultMikroOrmOptions, ...options })],
			controllers,
			providers,
		};
	}
}
