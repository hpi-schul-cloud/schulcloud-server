import { Module } from '@nestjs/common';
import { BoardImportModule } from './board-import.module';

@Module({
	imports: [BoardImportModule],
})
export class BoardImportApiModule {}
