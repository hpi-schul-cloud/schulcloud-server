import { Module } from '@nestjs/common';
import { ConsoleWriterModule } from '@shared/infra/console';
import { LoggerModule } from '@src/core/logger';
import { BoardManagementConsole } from './console/board-management.console';
import { BoardNodeRepo, CardRepo, ColumnBoardRepo } from './repo';
import { ColumnBoardService } from './service/board.service';
import { CardService } from './service/card.service';
import { BoardManagementUc } from './uc';

@Module({
	imports: [ConsoleWriterModule, LoggerModule],
	providers: [
		BoardManagementConsole,
		BoardManagementUc,
		CardRepo,
		BoardNodeRepo,
		ColumnBoardRepo,
		ColumnBoardService,
		CardService,
	],
	exports: [ColumnBoardService, CardService],
})
export class BoardModule {}
