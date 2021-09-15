import { Module } from '@nestjs/common';
import { ConsoleModule } from 'nestjs-console';
import { DeleteFilesController } from './controller/delete-files.controller';
import { LoggerModule } from '../../core/logger/logger.module';
import { FilesRepo, FileStorageRepo } from './repo';
import { DeleteFilesUc } from './uc';

@Module({
	imports: [ConsoleModule, LoggerModule],
	providers: [DeleteFilesController, DeleteFilesUc, FilesRepo, FileStorageRepo],
	// exports: [DeleteFilesController]
})
export class FilesModule {}
