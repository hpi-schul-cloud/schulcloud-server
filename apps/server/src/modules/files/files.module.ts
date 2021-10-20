import { Module } from '@nestjs/common';
import { ConsoleModule } from 'nestjs-console';
import { DeleteFilesConsole } from './job/delete-files.console';
import { LoggerModule } from '../../core/logger/logger.module';
import { FilesRepo, StorageProviderRepo } from './repo';
import { DeleteFilesUc } from './uc';

@Module({
	imports: [ConsoleModule, LoggerModule],
	providers: [DeleteFilesConsole, DeleteFilesUc, FilesRepo, StorageProviderRepo],
})
export class FilesModule {}
