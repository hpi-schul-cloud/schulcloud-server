import { ConfigurationModule } from '@infra/configuration';
import { Module } from '@nestjs/common';
import { BoardImportAmqpModule } from './board-import-amqp.module';
import { BOARD_IMPORT_CONFIG_TOKEN, BoardImportConfig } from './board-import.config';
import { BOARD_IMPORT_JOB_REPO, BoardImportJobService } from './domain';
import { BoardImportJobMikroOrmRepo } from './repo/mikro-orm';

@Module({
	imports: [ConfigurationModule.register(BOARD_IMPORT_CONFIG_TOKEN, BoardImportConfig), BoardImportAmqpModule],
	providers: [
		{
			provide: BOARD_IMPORT_JOB_REPO,
			useClass: BoardImportJobMikroOrmRepo,
		},
		BoardImportJobService,
	],
	exports: [BoardImportJobService],
})
export class BoardImportModule {}
