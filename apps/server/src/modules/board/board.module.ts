import { Module } from '@nestjs/common';
import { ContentElementFactory } from '@shared/domain';
import { ConsoleWriterModule } from '@shared/infra/console';
import { LoggerModule } from '@src/core/logger';
import { BoardManagementConsole } from './console';
import { BoardDoRepo, BoardNodeRepo } from './repo';
import { RecursiveDeleteVisitor } from './repo/recursive-delete.vistor';
import {
	BoardDoService,
	BoardNodeService,
	CardService,
	ColumnBoardService,
	ColumnService,
	ContentElementService,
} from './service';
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
		RecursiveDeleteVisitor,
		ContentElementFactory,
		BoardNodeService,
	],
	exports: [ColumnBoardService, ColumnService, CardService, ContentElementService, BoardNodeService],
})
export class BoardModule {}
