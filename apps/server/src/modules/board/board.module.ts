import { LoggerModule } from '@core/logger';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { TldrawClientModule } from '@infra/tldraw-client';
import { CollaborativeTextEditorModule } from '@modules/collaborative-text-editor';
import { CopyHelperModule } from '@modules/copy-helper';
import { CourseModule } from '@modules/course';
import { FilesStorageClientModule } from '@modules/files-storage-client';
import { ContextExternalToolModule } from '@modules/tool/context-external-tool';
import { UserModule } from '@modules/user';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
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
		CourseModule,
		CopyHelperModule,
		FilesStorageClientModule,
		LoggerModule,
		UserModule,
		ContextExternalToolModule,
		HttpModule,
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
		ColumnBoardCopyService,
		ColumnBoardLinkService,
		ColumnBoardReferenceService,
		ColumnBoardTitleService,
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
