import { ConsoleWriterModule } from '@infra/console';
import { CollaborativeTextEditorModule } from '@modules/collaborative-text-editor';
import { CopyHelperModule } from '@modules/copy-helper';
import { FilesStorageClientModule } from '@modules/files-storage-client';
import { TldrawClientModule } from '@modules/tldraw-client';
import { ContextExternalToolModule } from '@modules/tool/context-external-tool';
import { ToolConfigModule } from '@modules/tool/tool-config.module';
import { UserModule } from '@modules/user';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ColumnBoardNodeRepo, CourseRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { BoardNodeFactory } from './domain';
import { BoardNodeRepo } from './repo';
import {
	BoardCommonToolService,
	BoardContextService,
	BoardNodeAuthorizableService,
	BoardNodeService,
	ColumnBoardCopyService,
	ColumnBoardLinkService,
	ColumnBoardService,
	ContentElementUpdateService,
	UserDeletedEventHandlerService,
} from './service';

@Module({
	imports: [
		ConsoleWriterModule,
		CopyHelperModule,
		FilesStorageClientModule,
		LoggerModule,
		UserModule,
		ContextExternalToolModule,
		HttpModule,
		ToolConfigModule,
		TldrawClientModule,
		CqrsModule,
		CollaborativeTextEditorModule,
	],
	providers: [
		// TODO: move BoardDoAuthorizableService, BoardDoRepo, BoardDoService, BoardNodeRepo in separate module and move mediaboard related services in mediaboard module
		BoardContextService,
		BoardNodeAuthorizableService,
		BoardNodeRepo,
		BoardNodeService,
		BoardNodeFactory,
		BoardCommonToolService,
		ColumnBoardService,
		ContentElementUpdateService,
		CourseRepo, // TODO: import learnroom module instead. This is currently not possible due to dependency cycle with authorisation service
		ColumnBoardCopyService,
		ColumnBoardLinkService,
		UserDeletedEventHandlerService,
		ColumnBoardNodeRepo,
	],
	exports: [
		BoardNodeAuthorizableService,
		BoardNodeService,
		BoardNodeFactory,
		BoardCommonToolService,
		ColumnBoardService,
		ColumnBoardCopyService,
		ColumnBoardLinkService,
		ContentElementUpdateService,
	],
})
export class BoardModule {}
