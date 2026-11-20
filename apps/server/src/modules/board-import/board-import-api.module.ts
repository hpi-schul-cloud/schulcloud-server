import { Module } from '@nestjs/common';
import { BoardImportAmqpModule } from './board-import-amqp.module';
import { BoardImportModule } from './board-import.module';
import { BoardImportController } from './controller';
import { BoardImportUc } from './uc';

@Module({
	imports: [BoardImportModule, BoardImportAmqpModule],
	controllers: [BoardImportController],
	providers: [BoardImportUc],
})
export class BoardImportApiModule {}
