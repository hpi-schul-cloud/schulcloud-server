import { Module } from '@nestjs/common';
import { ContentElementFactory } from '@shared/domain';
import { ConsoleWriterModule } from '@shared/infra/console';
import { CourseRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
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
		BoardDoAuthorizableService,
		CourseRepo, // TODO: import learnroom module instead. This is currently not possible due to dependency cycle with authorisation service
	],
	exports: [ColumnBoardService, ColumnService, CardService, ContentElementService, BoardDoAuthorizableService],
})
export class BoardModule {}
