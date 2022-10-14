import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '../authorization';
import { FilesStorageConsumer } from './controller/files-storage.consumer';
import { FilesStorageModule } from './files-storage.module';

@Module({
	imports: [AuthorizationModule, FilesStorageModule, LoggerModule],
	providers: [FilesStorageConsumer],
})
export class FilesStorageAMQPModule {}
