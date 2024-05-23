import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { UseGuards, UsePipes } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WsException } from '@nestjs/websockets';
import { LegacyLogger } from '@src/core/logger';
import { WsJwtAuthGuard } from '@src/modules/authentication/guard/ws-jwt-auth.guard';
import { BoardResponseMapper, CardResponseMapper, ContentElementResponseFactory } from '../controller/mapper';
import { ColumnResponseMapper } from '../controller/mapper/column-response.mapper';
import { BoardDoAuthorizableService } from '../service';
import { BoardUc, CardUc, ColumnUc, ElementUc } from '../uc';
import {
	CreateCardMessageParams,
	DeleteColumnMessageParams,
	MoveCardMessageParams,
	UpdateColumnTitleMessageParams,
} from './dto';
import BoardCollaborationConfiguration from './dto/board-collaboration-config';
import { CreateColumnMessageParams } from './dto/create-column.message.param';
import { CreateContentElementMessageParams } from './dto/create-content-element.message.param';
import { DeleteBoardMessageParams } from './dto/delete-board.message.param';
import { DeleteCardMessageParams } from './dto/delete-card.message.param';
import { DeleteContentElementMessageParams } from './dto/delete-content-element.message.param';
import { FetchBoardMessageParams } from './dto/fetch-board.message.param';
import { FetchCardsMessageParams } from './dto/fetch-cards.message.param';
import { MoveColumnMessageParams } from './dto/move-column.message.param';
import { MoveContentElementMessageParams } from './dto/move-content-element.message.param';
import { UpdateBoardTitleMessageParams } from './dto/update-board-title.message.param';
import { UpdateBoardVisibilityMessageParams } from './dto/update-board-visibility.message.param';
import { UpdateCardHeightMessageParams } from './dto/update-card-height.message.param';
import { UpdateCardTitleMessageParams } from './dto/update-card-title.message.param';
import { UpdateContentElementMessageParams } from './dto/update-content-element.message.param';
import { Socket } from './types';
import { WsValidationPipe } from './ws-validation.pipe';

enum ErrorTypes {
	NOT_CREATED = 'notCreated',
	NOT_LOADED = 'notLoaded',
	NOT_UPDATED = 'notUpdated',
	NOT_DELETED = 'notDeleted',
}

enum BoardObjectTypes {
	BOARD = 'board',
	BOARD_COLUMN = 'boardColumn',
	BOARD_CARD = 'boardCard',
	BOARD_ELEMENT = 'boardElement',
}

@UsePipes(new WsValidationPipe())
@WebSocketGateway(BoardCollaborationConfiguration.websocket)
@UseGuards(WsJwtAuthGuard)
export class BoardCollaborationGateway {
	// TODO: use loggables instead of legacy logger
	constructor(
		private readonly logger: LegacyLogger,
		private readonly orm: MikroORM,
		private readonly boardUc: BoardUc,
		private readonly columnUc: ColumnUc,
		private readonly cardUc: CardUc,
		private readonly elementUc: ElementUc,
		private readonly authorizableService: BoardDoAuthorizableService // to be removed
	) {}

	private getCurrentUser(client: Socket) {
		const { user } = client.handshake;
		if (!user) throw new WsException('Not Authenticated.');
		return user;
	}

	public afterInit(): void {
		this.logger.log('Socket gateway initialized');
	}

	@SubscribeMessage('delete-board-request')
	@UseRequestContext()
	async deleteBoard(client: Socket, data: DeleteBoardMessageParams) {
		try {
			const { userId } = this.getCurrentUser(client);
			const room = await this.ensureUserInRoom(client, data.boardId);
			await this.boardUc.deleteBoard(userId, data.boardId);

			client.to(room).emit('delete-board-success', { ...data, isOwnAction: false });
			client.emit('delete-board-success', { ...data, isOwnAction: true });
		} catch (err) {
			client.emit('delete-board-failure', {
				boardObjectType: BoardObjectTypes.BOARD,
				errorType: ErrorTypes.NOT_DELETED,
				originalAction: data,
			});
		}
	}

	@SubscribeMessage('update-board-title-request')
	@UseRequestContext()
	async updateBoardTitle(client: Socket, data: UpdateBoardTitleMessageParams) {
		try {
			const { userId } = this.getCurrentUser(client);
			await this.boardUc.updateBoardTitle(userId, data.boardId, data.newTitle);

			const room = await this.ensureUserInRoom(client, data.boardId);
			client.to(room).emit('update-board-title-success', { ...data, isOwnAction: false });
			client.emit('update-board-title-success', { ...data, isOwnAction: true });
		} catch (err) {
			client.emit('update-board-title-failure', {
				boardObjectType: BoardObjectTypes.BOARD,
				errorType: ErrorTypes.NOT_UPDATED,
				originalAction: data,
			});
		}
	}

	@SubscribeMessage('update-card-title-request')
	@UseRequestContext()
	async updateCardTitle(client: Socket, data: UpdateCardTitleMessageParams) {
		try {
			const { userId } = this.getCurrentUser(client);
			await this.cardUc.updateCardTitle(userId, data.cardId, data.newTitle);

			const room = await this.ensureUserInRoom(client, data.cardId);
			client.to(room).emit('update-card-title-success', { ...data, isOwnAction: false });
			client.emit('update-card-title-success', { ...data, isOwnAction: true });
		} catch (err) {
			client.emit('update-card-title-failure', {
				boardObjectType: BoardObjectTypes.BOARD_CARD,
				errorType: ErrorTypes.NOT_UPDATED,
				originalAction: data,
			});
		}
	}

	@SubscribeMessage('update-card-height-request')
	@UseRequestContext()
	async updateCardHeight(client: Socket, data: UpdateCardHeightMessageParams) {
		try {
			const { userId } = this.getCurrentUser(client);
			await this.cardUc.updateCardHeight(userId, data.cardId, data.newHeight);

			const room = await this.ensureUserInRoom(client, data.cardId);
			client.to(room).emit('update-card-height-success', { ...data, isOwnAction: false });
			client.emit('update-card-height-success', { ...data, isOwnAction: true });
		} catch (err) {
			client.emit('update-card-height-failure', {
				boardObjectType: BoardObjectTypes.BOARD_CARD,
				errorType: ErrorTypes.NOT_UPDATED,
				originalAction: data,
			});
		}
	}

	@SubscribeMessage('delete-card-request')
	@UseRequestContext()
	async deleteCard(client: Socket, data: DeleteCardMessageParams) {
		try {
			const { userId } = this.getCurrentUser(client);
			const room = await this.ensureUserInRoom(client, data.cardId);
			await this.cardUc.deleteCard(userId, data.cardId);

			client.to(room).emit('delete-card-success', { ...data, isOwnAction: false });
			client.emit('delete-card-success', { ...data, isOwnAction: true });
		} catch (err) {
			client.emit('delete-card-failure', {
				boardObjectType: BoardObjectTypes.BOARD_CARD,
				errorType: ErrorTypes.NOT_DELETED,
				originalAction: data,
			});
		}
	}

	@SubscribeMessage('create-card-request')
	@UseRequestContext()
	async createCard(client: Socket, data: CreateCardMessageParams) {
		try {
			const { userId } = this.getCurrentUser(client);
			const card = await this.columnUc.createCard(userId, data.columnId);
			const responsePayload = {
				...data,
				newCard: card.getProps(),
			};

			const room = await this.ensureUserInRoom(client, data.columnId);
			client.to(room).emit('create-card-success', { ...responsePayload, isOwnAction: false });
			client.emit('create-card-success', { ...responsePayload, isOwnAction: true });
		} catch (err) {
			client.emit('create-card-failure', {
				boardObjectType: BoardObjectTypes.BOARD_CARD,
				errorType: ErrorTypes.NOT_CREATED,
				originalAction: data,
			});
		}
	}

	@SubscribeMessage('create-column-request')
	@UseRequestContext()
	async createColumn(client: Socket, data: CreateColumnMessageParams) {
		try {
			const { userId } = this.getCurrentUser(client);
			const column = await this.boardUc.createColumn(userId, data.boardId);
			const newColumn = ColumnResponseMapper.mapToResponse(column);
			const responsePayload = {
				...data,
				newColumn,
			};

			const room = await this.ensureUserInRoom(client, data.boardId);
			client.to(room).emit('create-column-success', { ...responsePayload, isOwnAction: false });
			client.emit('create-column-success', { ...responsePayload, isOwnAction: true });

			// payload needs to be returned to allow the client to do sequential operation
			// of createColumn and move the card into that column
			return responsePayload;
		} catch (err) {
			client.emit('create-column-failure', {
				boardObjectType: BoardObjectTypes.BOARD_COLUMN,
				errorType: ErrorTypes.NOT_CREATED,
				originalAction: data,
			});
			return {};
		}
	}

	@SubscribeMessage('fetch-board-request')
	@UseRequestContext()
	async fetchBoard(client: Socket, data: FetchBoardMessageParams) {
		try {
			const { userId } = this.getCurrentUser(client);
			const board = await this.boardUc.findBoard(userId, data.boardId);

			const responsePayload = BoardResponseMapper.mapToResponse(board);

			client.emit('fetch-board-success', responsePayload);
		} catch (err) {
			client.emit('fetch-board-failure', {
				boardObjectType: BoardObjectTypes.BOARD,
				errorType: ErrorTypes.NOT_LOADED,
				originalAction: data,
			});
		}
	}

	@SubscribeMessage('move-card-request')
	@UseRequestContext()
	async moveCard(client: Socket, data: MoveCardMessageParams) {
		try {
			const { userId } = this.getCurrentUser(client);
			await this.columnUc.moveCard(userId, data.cardId, data.toColumnId, data.newIndex);

			const room = await this.ensureUserInRoom(client, data.cardId);
			client.to(room).emit('move-card-success', { ...data, isOwnAction: false });
			client.emit('move-card-success', { ...data, isOwnAction: true });
		} catch (err) {
			client.emit('move-card-failure', {
				boardObjectType: BoardObjectTypes.BOARD_CARD,
				errorType: ErrorTypes.NOT_UPDATED,
				originalAction: data,
			});
		}
	}

	@SubscribeMessage('move-column-request')
	@UseRequestContext()
	async moveColumn(client: Socket, data: MoveColumnMessageParams) {
		try {
			const { userId } = this.getCurrentUser(client);
			await this.boardUc.moveColumn(userId, data.columnMove.columnId, data.targetBoardId, data.columnMove.addedIndex);

			const room = await this.ensureUserInRoom(client, data.targetBoardId);
			client.to(room).emit('move-column-success', { ...data, isOwnAction: false });
			client.emit('move-column-success', { ...data, isOwnAction: true });
		} catch (err) {
			client.emit('move-column-failure', {
				boardObjectType: BoardObjectTypes.BOARD_COLUMN,
				errorType: ErrorTypes.NOT_UPDATED,
				originalAction: data,
			});
		}
	}

	@SubscribeMessage('update-column-title-request')
	@UseRequestContext()
	async updateColumnTitle(client: Socket, data: UpdateColumnTitleMessageParams) {
		try {
			const { userId } = this.getCurrentUser(client);
			await this.columnUc.updateColumnTitle(userId, data.columnId, data.newTitle);

			const room = await this.ensureUserInRoom(client, data.columnId);
			client.to(room).emit('update-column-title-success', { ...data, isOwnAction: false });
			client.emit('update-column-title-success', { ...data, isOwnAction: true });
		} catch (err) {
			client.emit('update-column-title-failure', {
				boardObjectType: BoardObjectTypes.BOARD_COLUMN,
				errorType: ErrorTypes.NOT_UPDATED,
				originalAction: data,
			});
		}
	}

	@SubscribeMessage('update-board-visibility-request')
	@UseRequestContext()
	async updateBoardVisibility(client: Socket, data: UpdateBoardVisibilityMessageParams) {
		try {
			const { userId } = this.getCurrentUser(client);
			await this.boardUc.updateVisibility(userId, data.boardId, data.isVisible);

			const room = await this.ensureUserInRoom(client, data.boardId);
			client.to(room).emit('update-board-visibility-success', { ...data, isOwnAction: false });
			client.emit('update-board-visibility-success', { ...data, isOwnAction: true });
		} catch (err) {
			client.emit('update-board-visibility-failure', {
				boardObjectType: BoardObjectTypes.BOARD,
				errorType: ErrorTypes.NOT_UPDATED,
				originalAction: data,
			});
		}
	}

	@SubscribeMessage('delete-column-request')
	@UseRequestContext()
	async deleteColumn(client: Socket, data: DeleteColumnMessageParams) {
		try {
			const { userId } = this.getCurrentUser(client);
			const room = await this.ensureUserInRoom(client, data.columnId);
			await this.columnUc.deleteColumn(userId, data.columnId);

			client.to(room).emit('delete-column-success', { ...data, isOwnAction: false });
			client.emit('delete-column-success', { ...data, isOwnAction: true });
		} catch (err) {
			client.emit('delete-column-failure', {
				boardObjectType: BoardObjectTypes.BOARD_COLUMN,
				errorType: ErrorTypes.NOT_DELETED,
				originalAction: data,
			});
		}
	}

	@SubscribeMessage('fetch-card-request')
	@UseRequestContext()
	async fetchCards(client: Socket, data: FetchCardsMessageParams) {
		try {
			const { userId } = this.getCurrentUser(client);
			const cards = await this.cardUc.findCards(userId, data.cardIds);
			const cardResponses = cards.map((card) => CardResponseMapper.mapToResponse(card));

			await this.ensureUserInRoom(client, data.cardIds[0]);
			client.emit('fetch-card-success', { cards: cardResponses, isOwnAction: true });
		} catch (err) {
			client.emit('fetch-card-failure', {
				boardObjectType: BoardObjectTypes.BOARD_CARD,
				errorType: ErrorTypes.NOT_LOADED,
				originalAction: data,
			});
		}
	}

	@SubscribeMessage('create-element-request')
	@UseRequestContext()
	async createElement(client: Socket, data: CreateContentElementMessageParams) {
		try {
			const { userId } = this.getCurrentUser(client);
			const element = await this.cardUc.createElement(userId, data.cardId, data.type, data.toPosition);
			const responsePayload = {
				...data,
				newElement: ContentElementResponseFactory.mapToResponse(element),
			};

			const room = await this.ensureUserInRoom(client, data.cardId);
			client.to(room).emit('create-element-success', { ...responsePayload, isOwnAction: false });
			client.emit('create-element-success', { ...responsePayload, isOwnAction: true });
		} catch (err) {
			client.emit('create-element-failure', {
				boardObjectType: BoardObjectTypes.BOARD_ELEMENT,
				errorType: ErrorTypes.NOT_CREATED,
				originalAction: data,
			});
		}
	}

	@SubscribeMessage('update-element-request')
	@UseRequestContext()
	async updateElement(client: Socket, data: UpdateContentElementMessageParams) {
		try {
			const { userId } = this.getCurrentUser(client);
			await this.elementUc.updateElement(userId, data.elementId, data.data.content);

			const room = await this.ensureUserInRoom(client, data.elementId);
			client.to(room).emit('update-element-success', { ...data, isOwnAction: false });
			client.emit('update-element-success', { ...data, isOwnAction: true });
		} catch (err) {
			client.emit('update-element-failure', {
				boardObjectType: BoardObjectTypes.BOARD_ELEMENT,
				errorType: ErrorTypes.NOT_UPDATED,
				originalAction: data,
			});
		}
	}

	@SubscribeMessage('delete-element-request')
	@UseRequestContext()
	async deleteElement(client: Socket, data: DeleteContentElementMessageParams) {
		try {
			const { userId } = this.getCurrentUser(client);
			const room = await this.ensureUserInRoom(client, data.elementId);
			await this.elementUc.deleteElement(userId, data.elementId);

			client.to(room).emit('delete-element-success', { ...data, isOwnAction: false });
			client.emit('delete-element-success', { ...data, isOwnAction: true });
		} catch (err) {
			client.emit('delete-element-failure', {
				boardObjectType: BoardObjectTypes.BOARD_ELEMENT,
				errorType: ErrorTypes.NOT_DELETED,
				originalAction: data,
			});
		}
	}

	@SubscribeMessage('move-element-request')
	@UseRequestContext()
	async moveElement(client: Socket, data: MoveContentElementMessageParams) {
		try {
			const { userId } = this.getCurrentUser(client);
			await this.cardUc.moveElement(userId, data.elementId, data.toCardId, data.toPosition);

			const room = await this.ensureUserInRoom(client, data.elementId);
			client.to(room).emit('move-element-success', { ...data, isOwnAction: false });
			client.emit('move-element-success', { ...data, isOwnAction: true });
		} catch (err) {
			client.emit('move-element-failure', {
				boardObjectType: BoardObjectTypes.BOARD_ELEMENT,
				errorType: ErrorTypes.NOT_UPDATED,
				originalAction: data,
			});
		}
	}

	private async ensureUserInRoom(client: Socket, id: string) {
		const rootId = await this.getRootIdForId(id);
		const room = `board_${rootId}`;
		await client.join(room);
		return room;
	}

	// private async getRootIdForBoardDo(anyBoardDo: AnyBoardDo) {
	// 	return anyDo.ancestorIds[0];
	// }

	private async getRootIdForId(id: string) {
		const authorizable = await this.authorizableService.findById(id);
		const rootId = authorizable.rootDo.id;

		return rootId;
	}
}
