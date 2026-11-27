import { BoardImportSourceReaderModule } from '@modules/board-import';
import { Module } from '@nestjs/common';
import { BoardImportTaskcardsModule } from './board-import-taskcards.module';
import { BoardImportTaskcardsReaderService } from './domain/service/board-import-taskcards-reader.service';

@Module({
	imports: [BoardImportTaskcardsModule, BoardImportSourceReaderModule],
	providers: [BoardImportTaskcardsReaderService],
})
export class BoardImportTaskcardsReaderModule {}
