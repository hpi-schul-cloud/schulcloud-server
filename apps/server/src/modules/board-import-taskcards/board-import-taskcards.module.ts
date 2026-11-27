import { ConfigurationModule } from '@infra/configuration';
import { BoardImportSourceModule } from '@modules/board-import';
import { Module } from '@nestjs/common';
import { BOARD_IMPORT_TASKCARDS_CONFIG_TOKEN, BoardImportTaskcardsConfig } from './board-import-taskcards.config';
import { BoardImportTaskcardsSourceService } from './domain/service/board-import-taskcards-source.service';

@Module({
	imports: [
		ConfigurationModule.register(BOARD_IMPORT_TASKCARDS_CONFIG_TOKEN, BoardImportTaskcardsConfig),
		BoardImportSourceModule,
	],
	providers: [BoardImportTaskcardsSourceService],
})
export class BoardImportTaskcardsModule {}
