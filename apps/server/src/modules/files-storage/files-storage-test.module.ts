import { RabbitMQWrapperTestModule } from '@infra/rabbitmq';
import { Module } from '@nestjs/common';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { FilesStorageApiModule } from './files-storage-api.app.module';
import { TEST_ENTITIES } from './files-storage.entity.imports';

const imports = [
	FilesStorageApiModule,
	MongoMemoryDatabaseModule.forRoot({ entities: TEST_ENTITIES }),
	RabbitMQWrapperTestModule,
];

@Module({
	imports,
})
export class FilesStorageTestModule {}
