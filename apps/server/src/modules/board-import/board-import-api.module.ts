import { Module } from '@nestjs/common';
import { BoardImportModule } from './board-import.module';
import { BoardImportController } from './controller';
import { BoardImportUc } from './uc';

@Module({
	imports: [BoardImportModule],
	controllers: [BoardImportController],
	providers: [BoardImportUc],
})
export class BoardImportApiModule {}
