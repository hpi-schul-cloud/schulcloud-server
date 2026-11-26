import { Module } from '@nestjs/common';
import { BoardImportSourceRegistryService } from './domain/service/board-import-source-registry.service';

@Module({
	providers: [BoardImportSourceRegistryService],
	exports: [BoardImportSourceRegistryService],
})
export class BoardImportSourceModule {}
