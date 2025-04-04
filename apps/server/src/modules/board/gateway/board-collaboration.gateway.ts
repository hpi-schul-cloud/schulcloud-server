import { WsJwtAuthentication } from '@infra/auth-guard';
import { Socket, WsValidationPipe } from '@infra/socketio';
import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { UsePipes } from '@nestjs/common';
import {
	OnGatewayDisconnect,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
	WsException,
} from '@nestjs/websockets';
import { EntityId } from '@shared/domain/types';
import { Server } from 'socket.io';
import {
	BoardResponseMapper,
	CardResponseMapper,
	ColumnResponseMapper,
	ContentElementResponseFactory,
} from '../controller/mapper';
import { AnyBoardNode, ColumnBoard } from '../domain';
import { MetricsService } from '../metrics/metrics.service';
import { TrackExecutionTime } from '../metrics/track-execution-time.decorator';
import { BoardUc, CardUc, ColumnUc, ElementUc } from '../uc';
import {
	CreateCardMessageParams,
	CreateColumnMessageParams,
	CreateContentElementMessageParams,
	DeleteBoardMessageParams,
	DeleteCardMessageParams,
	DeleteColumnMessageParams,
	DeleteContentElementMessageParams,
	FetchBoardMessageParams,
	FetchCardsMessageParams,
	MoveCardMessageParams,
	MoveColumnMessageParams,
	MoveContentElementMessageParams,
	UpdateBoardLayoutMessageParams,
	UpdateBoardTitleMessageParams,
	UpdateBoardVisibilityMessageParams,
	UpdateCardHeightMessageParams,
	UpdateCardTitleMessageParams,
	UpdateColumnTitleMessageParams,
	UpdateContentElementMessageParams,
} from './dto';
import BoardCollaborationConfiguration from './dto/board-collaboration-config';

@UsePipes(new WsValidationPipe())
@WebSocketGateway(BoardCollaborationConfiguration.websocket)
@WsJwtAuthentication()
export class BoardCollaborationGateway implements OnGatewayDisconnect {
	@WebSocketServer()
	private server!: Server;

	// TODO: use loggables instead of legacy logger
	constructor(
		private readonly orm: MikroORM,
		private readonly boardUc: BoardUc,
		private readonly columnUc: ColumnUc,
		private readonly cardUc: CardUc,
		private readonly elementUc: ElementUc,
		private readonly metricsService: MetricsService
	) {}

	public trackExecutionTime(methodName: string, executionTimeMs: number): void {
		if (this.metricsService) {
			this.metricsService.setExecutionTime(methodName, executionTimeMs);
			this.metricsService.incrementActionCount(methodName);
			this.metricsService.incrementActionGauge(methodName);
			this.metricsService.incrementActionCount('all');
			this.metricsService.incrementActionGauge('all');
		}
	}

	private getCurrentUser(socket: Socket) {
		const { user } = socket.handshake;
		if (!user) throw new WsException('Not Authenticated.');
		return user;
	}

	private async updateRoomsAndUsersMetrics(socket: Socket): Promise<void> {
		const roomCount = Array.from(this.server.of('/').adapter.rooms.keys()).filter((key) =>
			key.startsWith('board_')
		).length;
		this.metricsService.setNumberOfBoardRooms(roomCount);
		const { user } = socket.handshake;
		await this.metricsService.trackRoleOfClient(socket.id, user?.userId);
	}

	public handleDisconnect(socket: Socket): void {
		this.metricsService.untrackClient(socket.id);
	}

	@SubscribeMessage('delete-board-request')
	@UseRequestContext()
	public async deleteBoard(socket: Socket, data: DeleteBoardMessageParams): Promise<void> {
		const emitter = this.buildBoardSocketEmitter({ socket, action: 'delete-board' });
		const { userId } = this.getCurrentUser(socket);
		try {
			const board = await this.boardUc.deleteBoard(userId, data.boardId);
			emitter.emitToClientAndRoom(data, board);
		} catch (err) {
			emitter.emitFailure(data);
		}
		await this.updateRoomsAndUsersMetrics(socket);
	}

	@SubscribeMessage('update-board-title-request')
	@TrackExecutionTime()
	@UseRequestContext()
	public async updateBoardTitle(socket: Socket, data: UpdateBoardTitleMessageParams): Promise<void> {
		const emitter = this.buildBoardSocketEmitter({ socket, action: 'update-board-title' });
		const { userId } = this.getCurrentUser(socket);
		try {
			const board = await this.boardUc.updateBoardTitle(userId, data.boardId, data.newTitle);
			emitter.emitToClientAndRoom(data, board);
		} catch (err) {
			emitter.emitFailure(data);
		}
		await this.updateRoomsAndUsersMetrics(socket);
	}

	@SubscribeMessage('update-card-title-request')
	@TrackExecutionTime()
	@UseRequestContext()
	public async updateCardTitle(socket: Socket, data: UpdateCardTitleMessageParams): Promise<void> {
		const emitter = this.buildBoardSocketEmitter({ socket, action: 'update-card-title' });
		const { userId } = this.getCurrentUser(socket);
		try {
			const card = await this.cardUc.updateCardTitle(userId, data.cardId, data.newTitle);
			emitter.emitToClientAndRoom(data, card);
		} catch (err) {
			emitter.emitFailure(data);
		}
		await this.updateRoomsAndUsersMetrics(socket);
	}

	@SubscribeMessage('update-card-height-request')
	@TrackExecutionTime()
	@UseRequestContext()
	public async updateCardHeight(socket: Socket, data: UpdateCardHeightMessageParams): Promise<void> {
		const emitter = this.buildBoardSocketEmitter({ socket, action: 'update-card-height' });
		const { userId } = this.getCurrentUser(socket);
		try {
			const card = await this.cardUc.updateCardHeight(userId, data.cardId, data.newHeight);
			emitter.emitToClientAndRoom(data, card);
		} catch (err) {
			emitter.emitFailure(data);
		}
		await this.updateRoomsAndUsersMetrics(socket);
	}

	@SubscribeMessage('delete-card-request')
	@TrackExecutionTime()
	@UseRequestContext()
	public async deleteCard(socket: Socket, data: DeleteCardMessageParams): Promise<void> {
		const emitter = this.buildBoardSocketEmitter({ socket, action: 'delete-card' });
		const { userId } = this.getCurrentUser(socket);
		try {
			const rootId = await this.cardUc.deleteCard(userId, data.cardId);
			emitter.emitToClientAndRoom(data, rootId);
		} catch (err) {
			emitter.emitFailure(data);
		}
		await this.updateRoomsAndUsersMetrics(socket);
	}

	@SubscribeMessage('create-card-request')
	@TrackExecutionTime()
	@UseRequestContext()
	public async createCard(socket: Socket, data: CreateCardMessageParams): Promise<void> {
		const emitter = this.buildBoardSocketEmitter({ socket, action: 'create-card' });
		const { userId } = this.getCurrentUser(socket);
		try {
			const card = await this.columnUc.createCard(userId, data.columnId, data.requiredEmptyElements);
			const newCard = CardResponseMapper.mapToResponse(card);

			const responsePayload = {
				...data,
				newCard,
			};

			emitter.emitToClientAndRoom(responsePayload, card);
		} catch (err) {
			emitter.emitFailure(data);
		}
		await this.updateRoomsAndUsersMetrics(socket);
	}

	@SubscribeMessage('create-column-request')
	@TrackExecutionTime()
	@UseRequestContext()
	public async createColumn(socket: Socket, data: CreateColumnMessageParams) {
		const emitter = this.buildBoardSocketEmitter({ socket, action: 'create-column' });
		const { userId } = this.getCurrentUser(socket);
		try {
			const column = await this.boardUc.createColumn(userId, data.boardId);

			const newColumn = ColumnResponseMapper.mapToResponse(column);
			const responsePayload = {
				...data,
				newColumn,
			};
			await emitter.joinRoom(column);
			emitter.emitToClientAndRoom(responsePayload, column);

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
	public async fetchBoard(socket: Socket, data: FetchBoardMessageParams): Promise<void> {
		const emitter = this.buildBoardSocketEmitter({ socket, action: 'fetch-board' });
		const { userId } = this.getCurrentUser(socket);
		try {
			const { board, features, permissions } = await this.boardUc.findBoard(userId, data.boardId);
			const responsePayload = BoardResponseMapper.mapToResponse(board, features, permissions);
			await emitter.joinRoom(board);
			emitter.emitSuccess(responsePayload);
		} catch (err) {
			emitter.emitFailure(data);
		}
		await this.updateRoomsAndUsersMetrics(socket);
	}

	@SubscribeMessage('move-card-request')
	@TrackExecutionTime()
	@UseRequestContext()
	public async moveCard(socket: Socket, data: MoveCardMessageParams): Promise<void> {
		const emitter = this.buildBoardSocketEmitter({ socket, action: 'move-card' });
		const { userId } = this.getCurrentUser(socket);
		try {
			const card = await this.columnUc.moveCard(userId, data.cardId, data.toColumnId, data.newIndex);
			emitter.emitToClientAndRoom(data, card);
		} catch (err) {
			emitter.emitFailure(data);
		}
		await this.updateRoomsAndUsersMetrics(socket);
	}

	@SubscribeMessage('move-column-request')
	@TrackExecutionTime()
	@UseRequestContext()
	public async moveColumn(socket: Socket, data: MoveColumnMessageParams): Promise<void> {
		const emitter = this.buildBoardSocketEmitter({ socket, action: 'move-column' });
		const { userId } = this.getCurrentUser(socket);
		try {
			const column = await this.boardUc.moveColumn(
				userId,
				data.columnMove.columnId,
				data.targetBoardId,
				data.columnMove.addedIndex
			);
			emitter.emitToClientAndRoom(data, column);
		} catch (err) {
			emitter.emitFailure(data);
		}
		await this.updateRoomsAndUsersMetrics(socket);
	}

	@SubscribeMessage('update-column-title-request')
	@TrackExecutionTime()
	@UseRequestContext()
	public async updateColumnTitle(socket: Socket, data: UpdateColumnTitleMessageParams): Promise<void> {
		const emitter = this.buildBoardSocketEmitter({ socket, action: 'update-column-title' });
		const { userId } = this.getCurrentUser(socket);
		try {
			const column = await this.columnUc.updateColumnTitle(userId, data.columnId, data.newTitle);
			emitter.emitToClientAndRoom(data, column);
		} catch (err) {
			emitter.emitFailure(data);
		}
		await this.updateRoomsAndUsersMetrics(socket);
	}

	@SubscribeMessage('update-board-visibility-request')
	@TrackExecutionTime()
	@UseRequestContext()
	public async updateBoardVisibility(socket: Socket, data: UpdateBoardVisibilityMessageParams): Promise<void> {
		const emitter = this.buildBoardSocketEmitter({ socket, action: 'update-board-visibility' });
		const { userId } = this.getCurrentUser(socket);
		try {
			const board = await this.boardUc.updateVisibility(userId, data.boardId, data.isVisible);
			emitter.emitToClientAndRoom(data, board);
		} catch (err) {
			emitter.emitFailure(data);
		}
		await this.updateRoomsAndUsersMetrics(socket);
	}

	@SubscribeMessage('update-board-layout-request')
	@TrackExecutionTime()
	@UseRequestContext()
	public async updateBoardLayout(socket: Socket, data: UpdateBoardLayoutMessageParams): Promise<void> {
		const emitter = this.buildBoardSocketEmitter({ socket, action: 'update-board-layout' });
		const { userId } = this.getCurrentUser(socket);
		try {
			const board: ColumnBoard = await this.boardUc.updateLayout(userId, data.boardId, data.layout);
			emitter.emitToClientAndRoom(data, board);
		} catch (err) {
			emitter.emitFailure(data);
		}
		await this.updateRoomsAndUsersMetrics(socket);
	}

	@SubscribeMessage('delete-column-request')
	@TrackExecutionTime()
	@UseRequestContext()
	public async deleteColumn(socket: Socket, data: DeleteColumnMessageParams): Promise<void> {
		const emitter = this.buildBoardSocketEmitter({ socket, action: 'delete-column' });
		const { userId } = this.getCurrentUser(socket);
		try {
			const rootId = await this.columnUc.deleteColumn(userId, data.columnId);
			emitter.emitToClientAndRoom(data, rootId);
		} catch (err) {
			emitter.emitFailure(data);
		}
		await this.updateRoomsAndUsersMetrics(socket);
	}

	@SubscribeMessage('fetch-card-request')
	@TrackExecutionTime()
	@UseRequestContext()
	public async fetchCards(socket: Socket, data: FetchCardsMessageParams): Promise<void> {
		const emitter = this.buildBoardSocketEmitter({ socket, action: 'fetch-card' });
		const { userId } = this.getCurrentUser(socket);
		try {
			const cards = await this.cardUc.findCards(userId, data.cardIds);
			const cardResponses = cards.map((card) => CardResponseMapper.mapToResponse(card));

			emitter.emitSuccess({ cards: cardResponses });
		} catch (err) {
			emitter.emitFailure(data);
		}
		await this.updateRoomsAndUsersMetrics(socket);
	}

	@SubscribeMessage('create-element-request')
	@TrackExecutionTime()
	@UseRequestContext()
	public async createElement(socket: Socket, data: CreateContentElementMessageParams): Promise<void> {
		const emitter = this.buildBoardSocketEmitter({ socket, action: 'create-element' });
		const { userId } = this.getCurrentUser(socket);
		try {
			const element = await this.cardUc.createElement(userId, data.cardId, data.type, data.toPosition);

			const responsePayload = {
				...data,
				newElement: ContentElementResponseFactory.mapToResponse(element),
			};
			emitter.emitToClientAndRoom(responsePayload, element);
		} catch (err) {
			emitter.emitFailure(data);
		}
		await this.updateRoomsAndUsersMetrics(socket);
	}

	@SubscribeMessage('update-element-request')
	@TrackExecutionTime()
	@UseRequestContext()
	public async updateElement(socket: Socket, data: UpdateContentElementMessageParams): Promise<void> {
		const emitter = this.buildBoardSocketEmitter({ socket, action: 'update-element' });
		const { userId } = this.getCurrentUser(socket);
		try {
			const element = await this.elementUc.updateElement(userId, data.elementId, data.data.content);
			emitter.emitToClientAndRoom(data, element);
		} catch (err) {
			emitter.emitFailure(data);
		}
		await this.updateRoomsAndUsersMetrics(socket);
	}

	@SubscribeMessage('delete-element-request')
	@TrackExecutionTime()
	@UseRequestContext()
	public async deleteElement(socket: Socket, data: DeleteContentElementMessageParams): Promise<void> {
		const emitter = this.buildBoardSocketEmitter({ socket, action: 'delete-element' });
		const { userId } = this.getCurrentUser(socket);

		try {
			const rootId = await this.elementUc.deleteElement(userId, data.elementId);
			emitter.emitToClientAndRoom(data, rootId);
		} catch (err) {
			emitter.emitFailure(data);
		}
		await this.updateRoomsAndUsersMetrics(socket);
	}

	@SubscribeMessage('move-element-request')
	@TrackExecutionTime()
	@UseRequestContext()
	public async moveElement(socket: Socket, data: MoveContentElementMessageParams): Promise<void> {
		const emitter = this.buildBoardSocketEmitter({ socket, action: 'move-element' });
		const { userId } = this.getCurrentUser(socket);

		try {
			const element = await this.cardUc.moveElement(userId, data.elementId, data.toCardId, data.toPosition);
			emitter.emitToClientAndRoom(data, element);
		} catch (err) {
			emitter.emitFailure(data);
		}
		await this.updateRoomsAndUsersMetrics(socket);
	}

	private buildBoardSocketEmitter({ socket, action }: { socket: Socket; action: string }) {
		const getRoomName = (boardNode: AnyBoardNode | EntityId): string => {
			const rootId = typeof boardNode === 'string' ? boardNode : boardNode.rootId;
			return `board_${rootId}`;
		};
		return {
			async joinRoom(boardNode: AnyBoardNode): Promise<void> {
				const room = getRoomName(boardNode);
				await socket.join(room);
			},
			emitSuccess(data: object): void {
				socket.emit(`${action}-success`, { ...data, isOwnAction: true });
			},
			emitToClientAndRoom(data: object, boardNodeOrRootId: AnyBoardNode | EntityId): void {
				const room = getRoomName(boardNodeOrRootId);
				socket.to(room).emit(`${action}-success`, { ...data, isOwnAction: false });
				socket.emit(`${action}-success`, { ...data, isOwnAction: true });
			},
			emitFailure(data: object): void {
				socket.emit(`${action}-failure`, data);
			},
		};
	}
}
