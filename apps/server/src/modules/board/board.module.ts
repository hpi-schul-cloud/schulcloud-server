import { Module } from '@nestjs/common';
import { ConsoleWriterModule } from '@shared/infra/console';
import { LoggerModule } from '@src/core/logger';
import { BoardManagementConsole } from './console';
import { BoardNodeRepo } from './repo';
import { ColumnBoardService, CardService, ContentElementService } from './service';
import { BoardManagementUc } from './uc';

@Module({
	imports: [ConsoleWriterModule, LoggerModule],
	providers: [
		BoardManagementConsole,
		BoardManagementUc,
		BoardNodeRepo,
		ColumnBoardService,
		CardService,
		ContentElementService,
	],
	exports: [ColumnBoardService, CardService, ContentElementService],
})
export class BoardModule {}
