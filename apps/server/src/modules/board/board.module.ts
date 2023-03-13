import { Module } from '@nestjs/common';
import { ConsoleWriterModule } from '@shared/infra/console';
import { LoggerModule } from '@src/core/logger';
import { BoardManagementConsole } from './console/board-management.console';
import { BoardController } from './controller/board.controller';
import { CardController } from './controller/card.controller';
import { BoardNodeRepo, CardRepo, ColumnBoardRepo, ContentElementRepo } from './repo';
import { ColumnRepo } from './repo/column.repo';
import { BoardManagementUc, BoardUc, CardUc } from './uc';

@Module({
	imports: [ConsoleWriterModule, LoggerModule],
	controllers: [BoardController, CardController],
	providers: [
		BoardManagementConsole,
		BoardManagementUc,
		BoardUc,
		CardRepo,
		CardUc,
		BoardNodeRepo,
		ColumnRepo,
		ColumnBoardRepo,
		ContentElementRepo,
	],
	exports: [],
})
export class BoardModule {}
