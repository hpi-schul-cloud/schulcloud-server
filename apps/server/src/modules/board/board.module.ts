import { Module } from '@nestjs/common';
import { ConsoleWriterModule } from '@shared/infra/console';
import { BoardManagementConsole } from './console/board-management.console';
import { BoardController } from './controller/board.controller';
import { AnyBoardDoBuilder } from './mapper';
import { BoardNodeRepo, ColumnBoardRepo } from './repo';
import { BoardManagementUc, BoardUc } from './uc';

@Module({
	imports: [ConsoleWriterModule],
	controllers: [BoardController],
	providers: [BoardManagementConsole, BoardManagementUc, BoardUc, BoardNodeRepo, ColumnBoardRepo, AnyBoardDoBuilder],
	exports: [],
})
export class BoardModule {}
