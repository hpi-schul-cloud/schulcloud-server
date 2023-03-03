import { Module } from '@nestjs/common';
import { ConsoleWriterModule } from '@shared/infra/console';
import { BoardManagementConsole } from './console/board-management.console';
import { AnyBoardDoBuilder } from './mapper';
import { BoardNodeRepo, ColumnBoardRepo } from './repo';
import { BoardManagementUc } from './uc/board-management.uc';

@Module({
	imports: [ConsoleWriterModule],
	controllers: [],
	providers: [BoardManagementConsole, BoardManagementUc, BoardNodeRepo, ColumnBoardRepo, AnyBoardDoBuilder],
	exports: [],
})
export class BoardModule {}
