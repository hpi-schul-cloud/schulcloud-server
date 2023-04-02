import { Module } from '@nestjs/common';
import { ConsoleWriterModule } from '@shared/infra/console';
import { LoggerModule } from '@src/core/logger';
import { BoardManagementConsole } from './console';
import { BoardDoRepo, BoardNodeRepo } from './repo';
import { BoardDoService, CardService, ColumnBoardService, ColumnService, ContentElementService } from './service';
import { BoardManagementUc } from './uc';

@Module({
	imports: [ConsoleWriterModule, LoggerModule],
	providers: [
		BoardDoRepo,
		BoardDoService,
		BoardManagementConsole,
		BoardManagementUc,
		BoardNodeRepo,
		CardService,
		ColumnBoardService,
		ColumnService,
		ContentElementService,
	],
	exports: [ColumnBoardService, ColumnService, CardService, ContentElementService],
})
export class BoardModule {}
