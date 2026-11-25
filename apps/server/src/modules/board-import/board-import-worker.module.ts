import { ConfigurationModule } from '@infra/configuration';
import { LoggerModule } from '@infra/logger';
import { Module } from '@nestjs/common';
import { BoardImportJobConsumer } from './amqp/board-import-job.consumer';
import { BoardImportAmqpModule } from './board-import-amqp.module';
import { BOARD_IMPORT_CONFIG_TOKEN, BoardImportConfig } from './board-import.config';
import { BoardImportModule } from './board-import.module';

@Module({
	imports: [
		ConfigurationModule.register(BOARD_IMPORT_CONFIG_TOKEN, BoardImportConfig),
		BoardImportModule,
		BoardImportAmqpModule,
		LoggerModule,
	],
	providers: [BoardImportJobConsumer],
})
export class BoardImportWorkerModule {}
