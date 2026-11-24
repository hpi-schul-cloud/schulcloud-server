import { ConfigurationModule } from '@infra/configuration';
import { Module } from '@nestjs/common';
import { BoardImportAmqpModule } from './board-import-amqp.module';
import { BOARD_IMPORT_CONFIG_TOKEN, BoardImportConfig } from './board-import.config';
import { LoggerModule } from '@infra/logger';
import {
	BOARD_IMPORT_JOB_REPO,
	BoardImportJobProcessService,
	BoardImportJobService,
	BoardImportRunnerService,
} from './domain';
import { BoardImportJobMikroOrmRepo } from './repo/mikro-orm';

const configModule = ConfigurationModule.register(BOARD_IMPORT_CONFIG_TOKEN, BoardImportConfig);

@Module({
	imports: [configModule, BoardImportAmqpModule, LoggerModule],
	providers: [
		{
			provide: BOARD_IMPORT_JOB_REPO,
			useClass: BoardImportJobMikroOrmRepo,
		},
		BoardImportJobService,
		BoardImportJobProcessService,
		BoardImportRunnerService,
	],
	exports: [configModule, BoardImportJobService, BoardImportJobProcessService],
})
export class BoardImportModule {}
