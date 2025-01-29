import { MongoMemoryDatabaseModule } from '@infra/database';
import { RabbitMQWrapperTestModule } from '@infra/rabbitmq';
import { Module } from '@nestjs/common';
import { User } from '@shared/domain/entity';
import { FilesStorageApiModule } from './files-storage-api.app.module';
import { ENTITIES } from './files-storage.entity.imports';

const imports = [
	FilesStorageApiModule,
	MongoMemoryDatabaseModule.forRoot({ entities: [...ENTITIES, User] }),
	RabbitMQWrapperTestModule,
];
const controllers = [];
const providers = [];
@Module({
	imports,
	controllers,
	providers,
})
export class FilesStorageTestModule {}
