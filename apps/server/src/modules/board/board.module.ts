import { Module } from '@nestjs/common';
import { ContentElementFactory } from '@shared/domain';
import { ConsoleWriterModule } from '@shared/infra/console';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '..';
import { LearnroomModule } from '../learnroom';
import { BoardManagementConsole } from './console';
import { BoardDoRepo, BoardNodeRepo } from './repo';
import { RecursiveDeleteVisitor } from './repo/recursive-delete.vistor';
import {
	BoardDoAuthorizableService,
	BoardDoService,
	CardService,
	ColumnBoardService,
	ColumnService,
	ContentElementService,
} from './service';
import { BoardManagementUc } from './uc';

@Module({
	imports: [AuthorizationModule, ConsoleWriterModule, LearnroomModule, LoggerModule],
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
		BoardDoAuthorizableService,
	],
	exports: [ColumnBoardService, ColumnService, CardService, ContentElementService, BoardDoAuthorizableService],
})
export class BoardModule {}
