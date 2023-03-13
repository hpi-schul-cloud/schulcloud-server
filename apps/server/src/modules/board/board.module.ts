import { Module } from '@nestjs/common';
import { ConsoleWriterModule } from '@shared/infra/console';
import { LoggerModule } from '@src/core/logger';
import { BoardManagementConsole } from './console';
import { BoardController, CardController } from './controller';
import { BoardNodeRepo, CardRepo, ColumnBoardRepo, ColumnRepo, ContentElementRepo } from './repo';
import { CardService, ColumnBoardService } from './service';
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
	exports: [ColumnBoardService, CardService],
})
export class BoardModule {}
