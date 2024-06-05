import { WsValidationPipe, Socket } from '@infra/socketio';
import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { UseGuards, UsePipes } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from '@nestjs/websockets';
import { RoleName } from '@shared/domain/interface';
import { WsJwtAuthGuard } from '@src/modules/authentication/guard/ws-jwt-auth.guard';
import { Server } from 'socket.io';
import { BoardResponseMapper, CardResponseMapper, ContentElementResponseFactory } from '../controller/mapper';
import { ColumnResponseMapper } from '../controller/mapper/column-response.mapper';
import { MetricsService } from '../metrics/metrics.service';
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

@UsePipes(new WsValidationPipe())
@WebSocketGateway(BoardCollaborationConfiguration.websocket)
@UseGuards(WsJwtAuthGuard)
export class BoardCollaborationGateway {
	// implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer()
	server?: Server;

	// TODO: use loggables instead of legacy logger
	constructor(
		private readonly orm: MikroORM,
		private readonly boardUc: BoardUc,
		private readonly columnUc: ColumnUc,
		private readonly cardUc: CardUc,
		private readonly elementUc: ElementUc,
		private readonly metricsService: MetricsService,
		private readonly authorizableService: BoardDoAuthorizableService // to be removed
	) {}

	private getCurrentUser(socket: Socket) {
		const { user } = socket.handshake;
		if (!user) throw new WsException('Not Authenticated.');
		return user;
	}

	private hasUserEditRights(socket: Socket) {
		const { user } = socket.handshake;
		const isTeacher = user ? user.roles.find((role) => role === RoleName.TEACHER) : false;
		return isTeacher;
	}

	private updateRoomsAndUsersMetrics() {
		if (!this.server) {
			throw new Error('Server is not initialized');
		}

		const userCount = Array.from(this.server.of('/').adapter.sids.keys()).length;
		const roomCount = Array.from(this.server.of('/').adapter.rooms.keys()).filter((key) =>
			key.startsWith('board_')
		).length;
		this.metricsService.setNumberOfUsers(userCount);
		this.metricsService.setNumberOfBoardRooms(roomCount);
	}

	public handleConnection(socket: Socket): void {
		if (!socket) {
			throw new Error('Server is not initialized');
		}
		this.updateRoomsAndUsersMetrics();
		const hasEditRights = this.hasUserEditRights(socket);
		if (hasEditRights) {
			this.metricsService.incrementNumberOfEditors();
		} else {
			this.metricsService.incrementNumberOfViewers();
		}
	}

	public handleDisconnect(socket: Socket): void {
		if (!socket) {
			throw new Error('Server is not initialized');
		}
		this.updateRoomsAndUsersMetrics();
		const hasEditRights = this.hasUserEditRights(socket);
		if (hasEditRights) {
			this.metricsService.decrementNumberOfEditors();
		} else {
			this.metricsService.decrementNumberOfViewers();
		}
	}

	@SubscribeMessage('delete-board-request')
	@UseRequestContext()
	async deleteBoard(socket: Socket, data: DeleteBoardMessageParams) {
		try {
			const emitter = await this.buildBoardSocketEmitter(socket, data.boardId);
			const { userId } = this.getCurrentUser(socket);
			await this.boardUc.deleteBoard(userId, data.boardId);

			await emitter.emitToClientAndRoom('delete-board-success', data);
		} catch (err) {
			socket.emit('delete-board-failure', data);
		}
	}

	@SubscribeMessage('update-board-title-request')
	@UseRequestContext()
	async updateBoardTitle(socket: Socket, data: UpdateBoardTitleMessageParams) {
		try {
			const emitter = await this.buildBoardSocketEmitter(socket, data.boardId);
			const { userId } = this.getCurrentUser(socket);
			await this.boardUc.updateBoardTitle(userId, data.boardId, data.newTitle);

			await emitter.emitToClientAndRoom('update-board-title-success', data);
		} catch (err) {
			socket.emit('update-board-title-failure', data);
		}
	}

	@SubscribeMessage('update-card-title-request')
	@UseRequestContext()
	async updateCardTitle(socket: Socket, data: UpdateCardTitleMessageParams) {
		try {
			const emitter = await this.buildBoardSocketEmitter(socket, data.cardId);
			const { userId } = this.getCurrentUser(socket);
			await this.cardUc.updateCardTitle(userId, data.cardId, data.newTitle);

			await emitter.emitToClientAndRoom('update-card-title-success', data);
		} catch (err) {
			socket.emit('update-card-title-failure', data);
		}
	}

	@SubscribeMessage('update-card-height-request')
	@UseRequestContext()
	async updateCardHeight(socket: Socket, data: UpdateCardHeightMessageParams) {
		try {
			const emitter = await this.buildBoardSocketEmitter(socket, data.cardId);
			const { userId } = this.getCurrentUser(socket);
			await this.cardUc.updateCardHeight(userId, data.cardId, data.newHeight);

			await emitter.emitToClientAndRoom('update-card-height-success', data);
		} catch (err) {
			socket.emit('update-card-height-failure', data);
		}
	}

	@SubscribeMessage('delete-card-request')
	@UseRequestContext()
	async deleteCard(socket: Socket, data: DeleteCardMessageParams) {
		try {
			const emitter = await this.buildBoardSocketEmitter(socket, data.cardId);
			const { userId } = this.getCurrentUser(socket);
			await this.cardUc.deleteCard(userId, data.cardId);

			await emitter.emitToClientAndRoom('delete-card-success', data);
		} catch (err) {
			socket.emit('delete-card-failure', data);
		}
	}

	@SubscribeMessage('create-card-request')
	@UseRequestContext()
	async createCard(socket: Socket, data: CreateCardMessageParams) {
		try {
			const emitter = await this.buildBoardSocketEmitter(socket, data.columnId);
			const { userId } = this.getCurrentUser(socket);
			const card = await this.columnUc.createCard(userId, data.columnId);
			const responsePayload = {
				...data,
				newCard: card.getProps(),
			};

			await emitter.emitToClientAndRoom('create-card-success', responsePayload);
		} catch (err) {
			socket.emit('create-card-failure', data);
		}
	}

	@SubscribeMessage('create-column-request')
	@UseRequestContext()
	async createColumn(socket: Socket, data: CreateColumnMessageParams) {
		try {
			const emitter = await this.buildBoardSocketEmitter(socket, data.boardId);
			const { userId } = this.getCurrentUser(socket);
			const column = await this.boardUc.createColumn(userId, data.boardId);
			const newColumn = ColumnResponseMapper.mapToResponse(column);
			const responsePayload = {
				...data,
				newColumn,
			};

			await emitter.emitToClientAndRoom('create-column-success', responsePayload);

			// payload needs to be returned to allow the client to do sequential operation
			// of createColumn and move the card into that column
			return responsePayload;
		} catch (err) {
			socket.emit('create-column-failure', data);
			return {};
		}
	}

	@SubscribeMessage('fetch-board-request')
	@UseRequestContext()
	async fetchBoard(socket: Socket, data: FetchBoardMessageParams) {
		try {
			const emitter = await this.buildBoardSocketEmitter(socket, data.boardId);
			const { userId } = this.getCurrentUser(socket);

			const board = await this.boardUc.findBoard(userId, data.boardId);

			const responsePayload = BoardResponseMapper.mapToResponse(board);
			await emitter.emitToClient('fetch-board-success', responsePayload);
			this.updateRoomsAndUsersMetrics();
		} catch (err) {
			socket.emit('fetch-board-failure', data);
		}
	}

	@SubscribeMessage('move-card-request')
	@UseRequestContext()
	async moveCard(socket: Socket, data: MoveCardMessageParams) {
		try {
			const emitter = await this.buildBoardSocketEmitter(socket, data.cardId);
			const { userId } = this.getCurrentUser(socket);

			await this.columnUc.moveCard(userId, data.cardId, data.toColumnId, data.newIndex);

			await emitter.emitToClientAndRoom('move-card-success', data);
		} catch (err) {
			socket.emit('move-card-failure', data);
		}
	}

	@SubscribeMessage('move-column-request')
	@UseRequestContext()
	async moveColumn(socket: Socket, data: MoveColumnMessageParams) {
		try {
			const emitter = await this.buildBoardSocketEmitter(socket, data.targetBoardId);
			const { userId } = this.getCurrentUser(socket);

			await this.boardUc.moveColumn(userId, data.columnMove.columnId, data.targetBoardId, data.columnMove.addedIndex);

			await emitter.emitToClientAndRoom('move-column-success', data);
		} catch (err) {
			socket.emit('move-column-failure', data);
		}
	}

	@SubscribeMessage('update-column-title-request')
	@UseRequestContext()
	async updateColumnTitle(socket: Socket, data: UpdateColumnTitleMessageParams) {
		try {
			const emitter = await this.buildBoardSocketEmitter(socket, data.columnId);
			const { userId } = this.getCurrentUser(socket);

			await this.columnUc.updateColumnTitle(userId, data.columnId, data.newTitle);

			await emitter.emitToClientAndRoom('update-column-title-success', data);
		} catch (err) {
			socket.emit('update-column-title-failure', data);
		}
	}

	@SubscribeMessage('update-board-visibility-request')
	@UseRequestContext()
	async updateBoardVisibility(socket: Socket, data: UpdateBoardVisibilityMessageParams) {
		try {
			const emitter = await this.buildBoardSocketEmitter(socket, data.boardId);
			const { userId } = this.getCurrentUser(socket);

			await this.boardUc.updateVisibility(userId, data.boardId, data.isVisible);

			await emitter.emitToClientAndRoom('update-board-visibility-success', data);
		} catch (err) {
			socket.emit('update-board-visibility-failure', data);
		}
	}

	@SubscribeMessage('delete-column-request')
	@UseRequestContext()
	async deleteColumn(socket: Socket, data: DeleteColumnMessageParams) {
		try {
			const emitter = await this.buildBoardSocketEmitter(socket, data.columnId);
			const { userId } = this.getCurrentUser(socket);

			await this.columnUc.deleteColumn(userId, data.columnId);

			await emitter.emitToClientAndRoom('delete-column-success', data);
		} catch (err) {
			socket.emit('delete-column-failure', data);
		}
	}

	@SubscribeMessage('fetch-card-request')
	@UseRequestContext()
	async fetchCards(socket: Socket, data: FetchCardsMessageParams) {
		try {
			const emitter = await this.buildBoardSocketEmitter(socket, data.cardIds[0]);
			const { userId } = this.getCurrentUser(socket);

			const cards = await this.cardUc.findCards(userId, data.cardIds);
			const cardResponses = cards.map((card) => CardResponseMapper.mapToResponse(card));

			await emitter.emitToClient('fetch-card-success', { cards: cardResponses, isOwnAction: false });
		} catch (err) {
			socket.emit('fetch-card-failure', data);
		}
	}

	@SubscribeMessage('create-element-request')
	@UseRequestContext()
	async createElement(socket: Socket, data: CreateContentElementMessageParams) {
		try {
			const emitter = await this.buildBoardSocketEmitter(socket, data.cardId);
			const { userId } = this.getCurrentUser(socket);

			const element = await this.cardUc.createElement(userId, data.cardId, data.type, data.toPosition);

			const responsePayload = {
				...data,
				newElement: ContentElementResponseFactory.mapToResponse(element),
			};
			await emitter.emitToClientAndRoom('create-element-success', responsePayload);
		} catch (err) {
			socket.emit('create-element-failure', data);
		}
	}

	@SubscribeMessage('update-element-request')
	@UseRequestContext()
	async updateElement(socket: Socket, data: UpdateContentElementMessageParams) {
		try {
			const emitter = await this.buildBoardSocketEmitter(socket, data.elementId);
			const { userId } = this.getCurrentUser(socket);

			await this.elementUc.updateElement(userId, data.elementId, data.data.content);

			await emitter.emitToClientAndRoom('update-element-success', data);
		} catch (err) {
			socket.emit('update-element-failure', data);
		}
	}

	@SubscribeMessage('delete-element-request')
	@UseRequestContext()
	async deleteElement(socket: Socket, data: DeleteContentElementMessageParams) {
		try {
			const emitter = await this.buildBoardSocketEmitter(socket, data.elementId);
			const { userId } = this.getCurrentUser(socket);

			await this.elementUc.deleteElement(userId, data.elementId);

			await emitter.emitToClientAndRoom('delete-element-success', data);
		} catch (err) {
			socket.emit('delete-element-failure', data);
		}
	}

	@SubscribeMessage('move-element-request')
	@UseRequestContext()
	async moveElement(socket: Socket, data: MoveContentElementMessageParams) {
		try {
			const emitter = await this.buildBoardSocketEmitter(socket, data.elementId);
			const { userId } = this.getCurrentUser(socket);

			await this.cardUc.moveElement(userId, data.elementId, data.toCardId, data.toPosition);

			await emitter.emitToClientAndRoom('move-element-success', data);
		} catch (err) {
			socket.emit('move-element-failure', data);
		}
	}

	private async buildBoardSocketEmitter(client: Socket, id: string) {
		const rootId = await this.getRootIdForId(id);
		const room = `board_${rootId}`;
		return {
			async emitToClient(event: string, data: object) {
				await client.join(room);
				client.emit(event, { ...data, isOwnAction: true });
			},
			async emitToClientAndRoom(event: string, data: object) {
				await client.join(room);
				client.to(room).emit(event, { ...data, isOwnAction: false });
				client.emit(event, { ...data, isOwnAction: true });
			},
		};
	}

	private async getRootIdForId(id: string) {
		const authorizable = await this.authorizableService.findById(id);
		const rootId = authorizable.rootDo.id;

		return rootId;
	}
}
