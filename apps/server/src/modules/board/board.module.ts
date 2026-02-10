import { CoreModule } from '@core/core.module';
import { LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { H5P_EXCHANGE_CONFIG_TOKEN, H5pEditorClientModule, H5pExchangeConfig } from '@infra/h5p-editor-client';
import { RABBITMQ_CONFIG_TOKEN, RabbitMQConfig } from '@infra/rabbitmq';
import { TldrawClientModule } from '@infra/tldraw-client';
import { CollaborativeTextEditorModule } from '@modules/collaborative-text-editor';
import { CopyHelperModule } from '@modules/copy-helper';
import { CourseModule } from '@modules/course';
import {
	FILES_STORAGE_CLIENT_CONFIG_TOKEN,
	FilesStorageClientConfig,
	FilesStorageClientModule,
} from '@modules/files-storage-client';
import { RoomModule } from '@modules/room';
import { ContextExternalToolModule } from '@modules/tool/context-external-tool';
import { UserModule } from '@modules/user';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthorizationModule } from '../authorization';
import { RoomMembershipModule } from '../room-membership';
import { BoardNodeRule } from './authorisation/board-node.rule';
import { BOARD_CONFIG_TOKEN, BoardConfig } from './board.config';
import { BoardNodeFactory, MediaBoardNodeFactory } from './domain';
import { BoardNodeRepo } from './repo';
import { BoardNodeEventSubscriber } from './repo/board-node-event-subscriber';
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
	BoardCopyService,
	BoardNodeCopyService,
	BoardNodeDeleteHooksService,
	ColumnBoardLinkService,
	ColumnBoardReferenceService,
	ColumnBoardTitleService,
	ContentElementUpdateService,
} from './service/internal';
import { TLDRAW_CLIENT_CONFIG_TOKEN, TldrawClientConfig } from './tldraw-client.config';

@Module({
	imports: [
		CoreModule,
		CourseModule,
		CopyHelperModule,
		LoggerModule,
		UserModule,
		ContextExternalToolModule,
		HttpModule,
		TldrawClientModule.register(TLDRAW_CLIENT_CONFIG_TOKEN, TldrawClientConfig),
		CollaborativeTextEditorModule,
		AuthorizationModule,
		RoomModule,
		RoomMembershipModule,
		H5pEditorClientModule.register({
			exchangeConfigInjectionToken: H5P_EXCHANGE_CONFIG_TOKEN,
			exchangeConfigConstructor: H5pExchangeConfig,
			configInjectionToken: RABBITMQ_CONFIG_TOKEN,
			configConstructor: RabbitMQConfig,
		}),
		FilesStorageClientModule.register({
			exchangeConfigConstructor: FilesStorageClientConfig,
			exchangeConfigInjectionToken: FILES_STORAGE_CLIENT_CONFIG_TOKEN,
			configInjectionToken: RABBITMQ_CONFIG_TOKEN,
			configConstructor: RabbitMQConfig,
		}),
		CqrsModule,
		ConfigurationModule.register(BOARD_CONFIG_TOKEN, BoardConfig),
	],
	providers: [
		// TODO: move BoardDoAuthorizableService, BoardDoRepo, BoardDoService, BoardNodeRepo in separate module and move mediaboard related services in mediaboard module
		BoardContextService,
		BoardNodeAuthorizableService,
		BoardNodeRepo,
		BoardNodeRule,
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
		MediaBoardNodeFactory,
		MediaBoardService,
		BoardNodeEventSubscriber,
	],
	exports: [
		BoardNodeAuthorizableService,
		BoardNodeFactory,
		BoardNodeRule,
		BoardNodeService,
		BoardCommonToolService,
		ColumnBoardService,
	],
})
export class BoardModule {}
