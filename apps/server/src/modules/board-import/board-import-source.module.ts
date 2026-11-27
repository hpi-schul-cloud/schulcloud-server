import { Module } from '@nestjs/common';
import { BoardImportSourceRegistryService } from './domain/service/board-import-source-registry.service';
import { BoardImportSourceService } from './domain/service/board-import-source.service';

@Module({
	providers: [BoardImportSourceRegistryService, BoardImportSourceService],
	exports: [BoardImportSourceRegistryService, BoardImportSourceService],
})
export class BoardImportSourceModule {}
