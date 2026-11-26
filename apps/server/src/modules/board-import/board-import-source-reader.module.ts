import { Module } from '@nestjs/common';
import { BoardImportSourceModule } from './board-import-source.module';
import { BoardImportSourceReaderRegistryService } from './domain/service/board-import-source-reader-registry.service';

@Module({
	imports: [BoardImportSourceModule],
	providers: [BoardImportSourceReaderRegistryService],
	exports: [BoardImportSourceReaderRegistryService],
})
export class BoardImportSourceReaderModule {}
