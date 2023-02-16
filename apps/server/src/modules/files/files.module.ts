import { Module } from '@nestjs/common';
import { FileStorageAdapter } from '@shared/infra/filestorage';
import { FilesRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { DeleteFilesConsole } from './job/delete-files.console';
import { DeleteFilesUc } from './uc';

@Module({
	imports: [LoggerModule],
	providers: [DeleteFilesConsole, DeleteFilesUc, FilesRepo, FileStorageAdapter],
})
export class FilesModule {}
