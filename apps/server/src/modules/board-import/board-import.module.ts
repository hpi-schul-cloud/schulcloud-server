import { Module } from '@nestjs/common';
import { BoardImportJobService } from './domain';

@Module({
	providers: [BoardImportJobService],
	exports: [BoardImportJobService],
})
export class BoardImportModule {}
