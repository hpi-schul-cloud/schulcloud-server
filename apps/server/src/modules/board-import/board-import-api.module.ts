import { Module } from '@nestjs/common';
import { BoardImportAmqpModule } from './board-import-amqp.module';
import { BoardImportModule } from './board-import.module';
import { BoardImportController } from './controller';

@Module({
	imports: [BoardImportModule, BoardImportAmqpModule],
	controllers: [BoardImportController],
})
export class BoardImportApiModule {}
