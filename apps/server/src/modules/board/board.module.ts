import { ConsoleWriterModule } from '@infra/console';
import { FilesStorageClientModule } from '@modules/files-storage-client';
import { ContextExternalToolModule } from '@modules/tool/context-external-tool';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { ContentElementFactory } from '@shared/domain/domainobject';
import { CourseRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { DrawingElementAdapterService } from '@modules/tldraw-client/service/drawing-element-adapter.service';
import { HttpModule } from '@nestjs/axios';
import { ToolConfigModule } from '@modules/tool/tool-config.module';
import { DrawingAssetDoAuthorizableService } from './service/drawing-asset-do-authorizable.service';
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
		DrawingElementAdapterService,
		DrawingAssetDoAuthorizableService,
	],
	exports: [
		BoardDoAuthorizableService,
		CardService,
		ColumnBoardService,
		ColumnService,
		ContentElementService,
		SubmissionItemService,
		ColumnBoardCopyService,
		DrawingAssetDoAuthorizableService,
	],
})
export class BoardModule {}
