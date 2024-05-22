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
import { CourseRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { BoardNodeFactory } from './domain';
import { BoardNodeRepo } from './repo';
import {
	BoardCommonToolService,
	BoardContextService,
	BoardNodeAuthorizableService,
	BoardNodeCopyService,
	BoardNodeDeleteHooksService,
	BoardNodeService,
	ColumnBoardCopyService,
	ColumnBoardLinkService,
	ColumnBoardService,
	ColumnBoardTitleService,
	MediaBoardService,
	UserDeletedEventHandlerService,
} from './service';
import { ContentElementUpdateService } from './service/internal';

@Module({
	imports: [
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
		BoardNodeCopyService,
		BoardCommonToolService,
		BoardNodeDeleteHooksService,
		ColumnBoardService,
		ContentElementUpdateService,
		CourseRepo, // TODO: import learnroom module instead. This is currently not possible due to dependency cycle with authorisation service
		ColumnBoardCopyService,
		ColumnBoardLinkService,
		ColumnBoardTitleService,
		UserDeletedEventHandlerService,
		// TODO replace by import of MediaBoardModule (fix dependency cycle)
		MediaBoardService,
	],
	exports: [
		BoardNodeAuthorizableService,
		BoardNodeService,
		BoardNodeFactory,
		BoardCommonToolService,
		ColumnBoardService,
		ColumnBoardCopyService,
		ColumnBoardLinkService,
	],
})
export class BoardModule {}
