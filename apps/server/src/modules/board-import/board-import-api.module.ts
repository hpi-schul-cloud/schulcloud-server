import { Module } from '@nestjs/common';
import { BoardImportModule } from './board-import.module';
import { BoardImportController } from './controller';

@Module({
	imports: [BoardImportModule],
	controllers: [BoardImportController],
})
export class BoardImportApiModule {}
