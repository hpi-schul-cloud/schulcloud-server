import { Module } from '@nestjs/common';
import { ConsoleModule } from 'nestjs-console';
import { DeleteFilesConsole } from './console/delete-files.console';
import { LoggerModule } from '../../core/logger/logger.module';
import { FilesRepo, FileStorageRepo } from './repo';
import { DeleteFilesUc } from './uc';

@Module({
	imports: [ConsoleModule, LoggerModule],
	providers: [DeleteFilesConsole, DeleteFilesUc, FilesRepo, FileStorageRepo],
})
export class FilesModule {}
