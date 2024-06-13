import { WsValidationPipe, Socket } from '@infra/socketio';
import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { UseGuards, UsePipes } from '@nestjs/common';
import {
	OnGatewayConnection,
	OnGatewayDisconnect,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
	WsException,
} from '@nestjs/websockets';
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
import { TrackExecutionTime } from '../metrics/track-execution-time.decorator';

@UsePipes(new WsValidationPipe())
@WebSocketGateway(BoardCollaborationConfiguration.websocket)
@UseGuards(WsJwtAuthGuard)
export class BoardCollaborationGateway implements OnGatewayConnection, OnGatewayDisconnect {
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

	trackExecutionTime(methodName: string, executionTimeMs: number) {
		if (this.metricsService) {
			this.metricsService.setExecutionTime(methodName, executionTimeMs);
		}
	}

	private getCurrentUser(socket: Socket) {
		const { user } = socket.handshake;
		if (!user) throw new WsException('Not Authenticated.');
		return user;
	}

	private async updateRoomsAndUsersMetrics(socket: Socket) {
		if (!this.server) {
			throw new Error('Server is not initialized');
		}

		const roomCount = Array.from(this.server.of('/').adapter.rooms.keys()).filter((key) =>
			key.startsWith('board_')
		).length;
		this.metricsService.setNumberOfBoardRooms(roomCount);
		const { user } = socket.handshake;
		await this.metricsService.trackRoleOfClient(socket.id, user?.userId);
	}

	public handleConnection(socket: Socket): Promise<void> {
		if (!socket) {
			throw new Error('Server is not initialized');
		}
		return this.updateRoomsAndUsersMetrics(socket);
	}

	public handleDisconnect(socket: Socket): void {
		if (!socket) {
			throw new Error('Server is not initialized');
		}
		this.metricsService.untrackClient(socket.id);
	}

	@SubscribeMessage('delete-board-request')
	@UseRequestContext()
	async deleteBoard(socket: Socket, data: DeleteBoardMessageParams) {
		const emitter = await this.buildBoardSocketEmitter({ socket, id: data.boardId, action: 'delete-board' });
		const { userId } = this.getCurrentUser(socket);
		try {
			await this.boardUc.deleteBoard(userId, data.boardId);

			await emitter.emitToClientAndRoom(data);
		} catch (err) {
			emitter.emitFailure(data);
		}
		await this.updateRoomsAndUsersMetrics(socket);
	}

	@SubscribeMessage('update-board-title-request')
	@TrackExecutionTime()
	@UseRequestContext()
	async updateBoardTitle(socket: Socket, data: UpdateBoardTitleMessageParams) {
		const emitter = await this.buildBoardSocketEmitter({ socket, id: data.boardId, action: 'update-board-title' });
		const { userId } = this.getCurrentUser(socket);
		try {
			await this.boardUc.updateBoardTitle(userId, data.boardId, data.newTitle);

			await emitter.emitToClientAndRoom(data);
		} catch (err) {
			emitter.emitFailure(data);
		}
		await this.updateRoomsAndUsersMetrics(socket);
	}

	@SubscribeMessage('update-card-title-request')
	@TrackExecutionTime()
	@UseRequestContext()
	async updateCardTitle(socket: Socket, data: UpdateCardTitleMessageParams) {
		const emitter = await this.buildBoardSocketEmitter({ socket, id: data.cardId, action: 'update-card-title' });
		const { userId } = this.getCurrentUser(socket);
		try {
			await this.cardUc.updateCardTitle(userId, data.cardId, data.newTitle);

			await emitter.emitToClientAndRoom(data);
		} catch (err) {
			emitter.emitFailure(data);
		}
		await this.updateRoomsAndUsersMetrics(socket);
	}

	@SubscribeMessage('update-card-height-request')
	@UseRequestContext()
	async updateCardHeight(socket: Socket, data: UpdateCardHeightMessageParams) {
		const emitter = await this.buildBoardSocketEmitter({ socket, id: data.cardId, action: 'update-card-height' });
		const { userId } = this.getCurrentUser(socket);
		try {
			await this.cardUc.updateCardHeight(userId, data.cardId, data.newHeight);

			await emitter.emitToClientAndRoom(data);
		} catch (err) {
			emitter.emitFailure(data);
		}
		await this.updateRoomsAndUsersMetrics(socket);
	}

	@SubscribeMessage('delete-card-request')
	@UseRequestContext()
	async deleteCard(socket: Socket, data: DeleteCardMessageParams) {
		const emitter = await this.buildBoardSocketEmitter({ socket, id: data.cardId, action: 'delete-card' });
		const { userId } = this.getCurrentUser(socket);
		try {
			await this.cardUc.deleteCard(userId, data.cardId);

			await emitter.emitToClientAndRoom(data);
		} catch (err) {
			emitter.emitFailure(data);
		}
		await this.updateRoomsAndUsersMetrics(socket);
	}

	@SubscribeMessage('create-card-request')
	@TrackExecutionTime()
	@UseRequestContext()
	async createCard(socket: Socket, data: CreateCardMessageParams) {
		const emitter = await this.buildBoardSocketEmitter({ socket, id: data.columnId, action: 'create-card' });
		const { userId } = this.getCurrentUser(socket);
		try {
			const card = await this.columnUc.createCard(userId, data.columnId);
			const responsePayload = {
				...data,
				newCard: card.getProps(),
			};

			await emitter.emitToClientAndRoom(responsePayload);
		} catch (err) {
			emitter.emitFailure(data);
		}
		await this.updateRoomsAndUsersMetrics(socket);
	}

	@SubscribeMessage('create-column-request')
	@UseRequestContext()
	async createColumn(socket: Socket, data: CreateColumnMessageParams) {
		const emitter = await this.buildBoardSocketEmitter({ socket, id: data.boardId, action: 'create-column' });
		const { userId } = this.getCurrentUser(socket);
		try {
			const column = await this.boardUc.createColumn(userId, data.boardId);

			const newColumn = ColumnResponseMapper.mapToResponse(column);
			const responsePayload = {
				...data,
				newColumn,
			};
			await emitter.emitToClientAndRoom(responsePayload);

			// payload needs to be returned to allow the client to do sequential operation
			// of createColumn and move the card into that column
			return responsePayload;
		} catch (err) {
			emitter.emitFailure(data);
			return {};
		}
	}

	@SubscribeMessage('fetch-board-request')
	@TrackExecutionTime()
	@UseRequestContext()
	async fetchBoard(socket: Socket, data: FetchBoardMessageParams) {
		const emitter = await this.buildBoardSocketEmitter({ socket, id: data.boardId, action: 'fetch-board' });
		const { userId } = this.getCurrentUser(socket);
		try {
			const board = await this.boardUc.findBoard(userId, data.boardId);

			const responsePayload = BoardResponseMapper.mapToResponse(board);
			await emitter.emitToClient(responsePayload);
		} catch (err) {
			emitter.emitFailure(data);
		}
		await this.updateRoomsAndUsersMetrics(socket);
	}

	@SubscribeMessage('move-card-request')
	@UseRequestContext()
	async moveCard(socket: Socket, data: MoveCardMessageParams) {
		const emitter = await this.buildBoardSocketEmitter({ socket, id: data.cardId, action: 'move-card' });
		const { userId } = this.getCurrentUser(socket);
		try {
			await this.columnUc.moveCard(userId, data.cardId, data.toColumnId, data.newIndex);

			await emitter.emitToClientAndRoom(data);
		} catch (err) {
			emitter.emitFailure(data);
		}
		await this.updateRoomsAndUsersMetrics(socket);
	}

	@SubscribeMessage('move-column-request')
	@UseRequestContext()
	async moveColumn(socket: Socket, data: MoveColumnMessageParams) {
		const emitter = await this.buildBoardSocketEmitter({ socket, id: data.targetBoardId, action: 'move-column' });
		const { userId } = this.getCurrentUser(socket);
		try {
			await this.boardUc.moveColumn(userId, data.columnMove.columnId, data.targetBoardId, data.columnMove.addedIndex);

			await emitter.emitToClientAndRoom(data);
		} catch (err) {
			emitter.emitFailure(data);
		}
		await this.updateRoomsAndUsersMetrics(socket);
	}

	@SubscribeMessage('update-column-title-request')
	@TrackExecutionTime()
	@UseRequestContext()
	async updateColumnTitle(socket: Socket, data: UpdateColumnTitleMessageParams) {
		const emitter = await this.buildBoardSocketEmitter({ socket, id: data.columnId, action: 'update-column-title' });
		const { userId } = this.getCurrentUser(socket);
		try {
			await this.columnUc.updateColumnTitle(userId, data.columnId, data.newTitle);

			await emitter.emitToClientAndRoom(data);
		} catch (err) {
			emitter.emitFailure(data);
		}
		await this.updateRoomsAndUsersMetrics(socket);
	}

	@SubscribeMessage('update-board-visibility-request')
	@UseRequestContext()
	async updateBoardVisibility(socket: Socket, data: UpdateBoardVisibilityMessageParams) {
		const emitter = await this.buildBoardSocketEmitter({ socket, id: data.boardId, action: 'update-board-visibility' });
		const { userId } = this.getCurrentUser(socket);
		try {
			await this.boardUc.updateVisibility(userId, data.boardId, data.isVisible);

			await emitter.emitToClientAndRoom(data);
		} catch (err) {
			emitter.emitFailure(data);
		}
		await this.updateRoomsAndUsersMetrics(socket);
	}

	@SubscribeMessage('delete-column-request')
	@UseRequestContext()
	async deleteColumn(socket: Socket, data: DeleteColumnMessageParams) {
		const emitter = await this.buildBoardSocketEmitter({ socket, id: data.columnId, action: 'delete-column' });
		const { userId } = this.getCurrentUser(socket);
		try {
			await this.columnUc.deleteColumn(userId, data.columnId);

			await emitter.emitToClientAndRoom(data);
		} catch (err) {
			emitter.emitFailure(data);
		}
		await this.updateRoomsAndUsersMetrics(socket);
	}

	@SubscribeMessage('fetch-card-request')
	@TrackExecutionTime()
	@UseRequestContext()
	async fetchCards(socket: Socket, data: FetchCardsMessageParams) {
		const emitter = await this.buildBoardSocketEmitter({ socket, id: data.cardIds[0], action: 'fetch-card' });
		const { userId } = this.getCurrentUser(socket);
		try {
			const cards = await this.cardUc.findCards(userId, data.cardIds);
			const cardResponses = cards.map((card) => CardResponseMapper.mapToResponse(card));

			await emitter.emitToClient({ cards: cardResponses, isOwnAction: false });
		} catch (err) {
			emitter.emitFailure(data);
		}
		await this.updateRoomsAndUsersMetrics(socket);
	}

	@SubscribeMessage('create-element-request')
	@UseRequestContext()
	async createElement(socket: Socket, data: CreateContentElementMessageParams) {
		const emitter = await this.buildBoardSocketEmitter({ socket, id: data.cardId, action: 'create-element' });
		const { userId } = this.getCurrentUser(socket);
		try {
			const element = await this.cardUc.createElement(userId, data.cardId, data.type, data.toPosition);

			const responsePayload = {
				...data,
				newElement: ContentElementResponseFactory.mapToResponse(element),
			};
			await emitter.emitToClientAndRoom(responsePayload);
		} catch (err) {
			emitter.emitFailure(data);
		}
		await this.updateRoomsAndUsersMetrics(socket);
	}

	@SubscribeMessage('update-element-request')
	@TrackExecutionTime()
	@UseRequestContext()
	async updateElement(socket: Socket, data: UpdateContentElementMessageParams) {
		const emitter = await this.buildBoardSocketEmitter({ socket, id: data.elementId, action: 'update-element' });
		const { userId } = this.getCurrentUser(socket);
		try {
			await this.elementUc.updateElement(userId, data.elementId, data.data.content);

			await emitter.emitToClientAndRoom(data);
		} catch (err) {
			emitter.emitFailure(data);
		}
		await this.updateRoomsAndUsersMetrics(socket);
	}

	@SubscribeMessage('delete-element-request')
	@UseRequestContext()
	async deleteElement(socket: Socket, data: DeleteContentElementMessageParams) {
		const emitter = await this.buildBoardSocketEmitter({ socket, id: data.elementId, action: 'delete-element' });
		const { userId } = this.getCurrentUser(socket);

		try {
			await this.elementUc.deleteElement(userId, data.elementId);
			await emitter.emitToClientAndRoom(data);
		} catch (err) {
			emitter.emitFailure(data);
		}
		await this.updateRoomsAndUsersMetrics(socket);
	}

	@SubscribeMessage('move-element-request')
	@UseRequestContext()
	async moveElement(socket: Socket, data: MoveContentElementMessageParams) {
		const emitter = await this.buildBoardSocketEmitter({ socket, id: data.elementId, action: 'move-element' });
		const { userId } = this.getCurrentUser(socket);

		try {
			await this.cardUc.moveElement(userId, data.elementId, data.toCardId, data.toPosition);
			await emitter.emitToClientAndRoom(data);
		} catch (err) {
			emitter.emitFailure(data);
		}
		await this.updateRoomsAndUsersMetrics(socket);
	}

	private async buildBoardSocketEmitter({ socket, id, action }: { socket: Socket; id: string; action: string }) {
		const rootId = await this.getRootIdForId(id);
		const room = `board_${rootId}`;
		return {
			async emitToClient(data: object) {
				await socket.join(room);
				socket.emit(`${action}-success`, { ...data, isOwnAction: true });
			},
			async emitToClientAndRoom(data: object) {
				await socket.join(room);
				socket.to(room).emit(`${action}-success`, { ...data, isOwnAction: false });
				socket.emit(`${action}-success`, { ...data, isOwnAction: true });
			},
			emitFailure(data: object) {
				socket.emit(`${action}-failure`, data);
			},
		};
	}

	private async getRootIdForId(id: string) {
		const authorizable = await this.authorizableService.findById(id);
		const rootId = authorizable.rootDo.id;

		return rootId;
	}
}
