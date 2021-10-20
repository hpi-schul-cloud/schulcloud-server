import { Module } from '@nestjs/common';
import { DeleteFilesConsole } from './job/delete-files.console';
import { LoggerModule } from '../../core/logger/logger.module';
import { FilesRepo, FileStorageRepo } from './repo';
import { DeleteFilesUc } from './uc';

@Module({
	imports: [LoggerModule],
	providers: [DeleteFilesConsole, DeleteFilesUc, FilesRepo, FileStorageRepo],
})
export class FilesModule {}
