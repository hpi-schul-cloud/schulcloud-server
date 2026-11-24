import { LoggerModule } from '@infra/logger';
import { Module } from '@nestjs/common';
import { BoardImportJobConsumer } from './amqp/board-import-job.consumer';
import { BoardImportAmqpModule } from './board-import-amqp.module';
import { BoardImportModule } from './board-import.module';

@Module({
	imports: [BoardImportModule, BoardImportAmqpModule, LoggerModule],
	providers: [BoardImportJobConsumer],
})
export class BoardImportWorkerModule {}
