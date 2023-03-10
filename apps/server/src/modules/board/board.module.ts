import { Module } from '@nestjs/common';
import { ConsoleWriterModule } from '@shared/infra/console';
import { LoggerModule } from '@src/core/logger';
import { BoardManagementConsole } from './console/board-management.console';
import { BoardController } from './controller/board.controller';
import { CardController } from './controller/card.controller';
import { BoardNodeRepo, CardRepo, ColumnBoardRepo } from './repo';
import { BoardManagementUc, BoardUc, CardUc } from './uc';

@Module({
	imports: [ConsoleWriterModule, LoggerModule],
	providers: [BoardManagementConsole, BoardManagementUc, CardRepo, BoardNodeRepo, ColumnBoardRepo],
	exports: [],
})
export class BoardModule {}

@Module({
	imports: [BoardModule, LoggerModule],
	controllers: [BoardController, CardController],
	providers: [BoardUc, CardUc],
})
export class BoardApiModule {}
