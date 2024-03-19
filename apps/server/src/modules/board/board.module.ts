import { ConsoleWriterModule } from '@infra/console';
import { FilesStorageClientModule } from '@modules/files-storage-client';
import { TldrawClientModule } from '@modules/tldraw-client';
import { ContextExternalToolModule } from '@modules/tool/context-external-tool';
import { ToolConfigModule } from '@modules/tool/tool-config.module';
import { UserModule } from '@modules/user';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ContentElementFactory } from '@shared/domain/domainobject';
import { CourseRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { BoardDoRepo, BoardNodeRepo, RecursiveDeleteVisitor } from './repo';
import {
	BoardDoAuthorizableService,
	BoardDoService,
	CardService,
	ColumnBoardService,
	ColumnService,
	ContentElementService,
	SubmissionItemService,
} from './service';
import { BoardDoCopyService, SchoolSpecificFileCopyServiceFactory } from './service/board-do-copy-service';
import { ColumnBoardCopyService } from './service/column-board-copy.service';

@Module({
	imports: [
		ConsoleWriterModule,
		FilesStorageClientModule,
		LoggerModule,
		UserModule,
		ContextExternalToolModule,
		HttpModule,
		ToolConfigModule,
		TldrawClientModule,
	],
	providers: [
		BoardDoAuthorizableService,
		BoardDoRepo,
		BoardDoService,
		BoardNodeRepo,
		CardService,
		ColumnBoardService,
		ColumnService,
		ContentElementService,
		ContentElementFactory,
		CourseRepo, // TODO: import learnroom module instead. This is currently not possible due to dependency cycle with authorisation service
		RecursiveDeleteVisitor,
		SubmissionItemService,
		BoardDoCopyService,
		ColumnBoardCopyService,
		SchoolSpecificFileCopyServiceFactory,
	],
	exports: [
		BoardDoAuthorizableService,
		CardService,
		ColumnBoardService,
		ColumnService,
		ContentElementService,
		SubmissionItemService,
		ColumnBoardCopyService,
		/**
		 * @deprecated - exported only deprecated learnraum module
		 */
		BoardNodeRepo,
	],
})
export class BoardModule {}
