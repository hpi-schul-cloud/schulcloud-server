import { LoggerModule } from '@core/logger';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { H5pEditorClientModule } from '@infra/h5p-editor-client';
import { TldrawClientModule } from '@infra/tldraw-client';
import { CollaborativeTextEditorModule } from '@modules/collaborative-text-editor';
import { CopyHelperModule } from '@modules/copy-helper';
import { CourseModule } from '@modules/course';
import { RoomModule } from '@modules/room';
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
	BoardCopyService,
	ColumnBoardLinkService,
	ColumnBoardReferenceService,
	ColumnBoardTitleService,
	ContentElementUpdateService,
} from './service/internal';
import { BoardNodeEventSubscriber } from './repo/board-node-event-subscriber';
import { CqrsModule } from '@nestjs/cqrs';

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
		RoomModule,
		RoomMembershipModule,
		H5pEditorClientModule,
		CqrsModule,
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
		BoardCopyService,
		ColumnBoardLinkService,
		ColumnBoardReferenceService,
		ColumnBoardTitleService,
		ContextExternalToolDeletedEventHandlerService,
		// TODO replace by import of MediaBoardModule (fix dependency cycle)
		MediaBoardService,
		BoardNodeEventSubscriber,
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
