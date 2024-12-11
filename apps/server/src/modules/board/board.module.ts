import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { TldrawClientModule } from '@infra/tldraw-client';
import { CollaborativeTextEditorModule } from '@modules/collaborative-text-editor';
import { CopyHelperModule } from '@modules/copy-helper';
import { FilesStorageClientModule } from '@modules/files-storage-client';
import { ContextExternalToolModule } from '@modules/tool/context-external-tool';
import { UserModule } from '@modules/user';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CourseRepo } from '@shared/repo/course';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '../authorization';
import { RoomMembershipModule } from '../room-membership';
import { BoardNodeRule } from './authorisation/board-node.rule';
import { BoardNodeFactory } from './domain';
import { BoardNodeRepo } from './repo';
import {
	BoardCommonToolService,
	BoardNodeAuthorizableService,
	BoardNodeService,
	ColumnBoardService,
	ContextExternalToolDeletedEventHandlerService,
	MediaBoardService,
	UserDeletedEventHandlerService,
} from './service';
import {
	BoardContextService,
	BoardNodeCopyService,
	BoardNodeDeleteHooksService,
	ColumnBoardCopyService,
	ColumnBoardLinkService,
	ColumnBoardReferenceService,
	ColumnBoardTitleService,
	ContentElementUpdateService,
} from './service/internal';

@Module({
	imports: [
		CopyHelperModule,
		FilesStorageClientModule,
		LoggerModule,
		UserModule,
		ContextExternalToolModule,
		HttpModule,
		CqrsModule,
		TldrawClientModule.register({
			TLDRAW_ADMIN_API_CLIENT_BASE_URL: Configuration.get('TLDRAW_ADMIN_API_CLIENT__BASE_URL') as string,
			TLDRAW_ADMIN_API_CLIENT_API_KEY: Configuration.get('TLDRAW_ADMIN_API_CLIENT__API_KEY') as string,
		}),
		CollaborativeTextEditorModule,
		AuthorizationModule,
		RoomMembershipModule,
	],
	providers: [
		// TODO: move BoardDoAuthorizableService, BoardDoRepo, BoardDoService, BoardNodeRepo in separate module and move mediaboard related services in mediaboard module
		BoardNodeRule,
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
		ColumnBoardReferenceService,
		ColumnBoardTitleService,
		UserDeletedEventHandlerService,
		ContextExternalToolDeletedEventHandlerService,
		// TODO replace by import of MediaBoardModule (fix dependency cycle)
		MediaBoardService,
	],
	exports: [
		BoardNodeAuthorizableService,
		BoardNodeFactory,
		BoardNodeService,
		BoardCommonToolService,
		ColumnBoardService,
	],
})
export class BoardModule {}
