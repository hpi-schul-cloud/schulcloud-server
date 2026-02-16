import { ICurrentUser, WsJwtAuthentication } from '@infra/auth-guard';
import { Socket, WsValidationPipe } from '@infra/socketio';
import { EnsureRequestContext, MikroORM } from '@mikro-orm/core';
import { Inject, UsePipes } from '@nestjs/common';
import {
	OnGatewayConnection,
	OnGatewayDisconnect,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
	WsException,
} from '@nestjs/websockets';
import { EntityId } from '@shared/domain/types';
import { Server } from 'socket.io';
import { BOARD_CONFIG_TOKEN, BoardConfig } from '../board.config';
import { AnyContentElementResponse } from '../controller/dto';
import {
	BoardResponseMapper,
	CardResponseMapper,
	ColumnResponseMapper,
	ContentElementResponseFactory,
} from '../controller/mapper';
import { MoveCardResponseMapper } from '../controller/mapper/move-card-response.mapper';
import { AnyBoardNode, ColumnBoard } from '../domain';
import { MetricsService } from '../metrics/metrics.service';
import { TrackExecutionTime } from '../metrics/track-execution-time.decorator';
import { BoardUc, CardUc, ColumnUc, ElementUc } from '../uc';
import {
	CopyCardMessageParams,
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
	MoveCardToBoardMessageParams,
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
import { UpdateReadersCanEditMessageParams } from './dto/update-users-can-edit.message.param';

// Using a variable here to access the exchange name in the decorator
const websocketOptions = {
	path: '',
	cors: {
		origin: '',
		methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
		preflightContinue: false,
		optionsSuccessStatus: 204,
		credentials: true,
	},
};
@UsePipes(new WsValidationPipe())
@WebSocketGateway(websocketOptions)
@WsJwtAuthentication()
export class BoardCollaborationGateway implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer()
	private server!: Server;

	// TODO: use loggables instead of legacy logger
	constructor(
		private readonly orm: MikroORM,
		private readonly boardUc: BoardUc,
		private readonly columnUc: ColumnUc,
		private readonly cardUc: CardUc,
		private readonly elementUc: ElementUc,
		private readonly metricsService: MetricsService,
		@Inject(BOARD_CONFIG_TOKEN) private readonly boardConfig: BoardConfig
	) {
		websocketOptions.cors.origin = this.boardConfig.hostUrl;
		websocketOptions.path = this.boardConfig.basePath;
	}

	public trackExecutionTime(methodName: string, executionTimeMs: number): void {
		if (this.metricsService) {
			this.metricsService.setExecutionTime(methodName, executionTimeMs);
			this.metricsService.incrementActionCount(methodName);
			this.metricsService.incrementActionGauge(methodName);
			this.metricsService.incrementActionCount('all');
			this.metricsService.incrementActionGauge('all');
		}
	}

	private getCurrentUser(socket: Socket): ICurrentUser {
		const { user } = socket.handshake;
		if (!user) throw new WsException('Not Authenticated.');
		return user;
	}

	public handleConnection(): void {
		this.updateTotalUserCount();
		this.updateTotalBoardCount();
	}

	public handleDisconnect(): void {
		this.updateTotalUserCount();
		this.updateTotalBoardCount();
	}

	private updateTotalUserCount(): void {
		const clientCount = this.server.engine.clientsCount;
		this.metricsService.setTotalUserCount(clientCount);
	}

	private updateTotalBoardCount(): void {
		const allRooms = this.server.sockets.adapter.rooms;
		let boardCount = 0;

		for (const [roomName, clients] of allRooms.entries()) {
			const isSocketId = clients.has(roomName);
			if (!isSocketId) {
				boardCount++;
			}
		}

		this.metricsService.setTotalBoardCount(boardCount);
	}

	@SubscribeMessage('delete-board-request')
	@EnsureRequestContext()
	public async deleteBoard(socket: Socket, data: DeleteBoardMessageParams): Promise<void> {
		const emitter = this.buildBoardSocketEmitter({ socket, action: 'delete-board' });
		const { userId } = this.getCurrentUser(socket);
		try {
			const board = await this.boardUc.deleteBoard(userId, data.boardId);
			emitter.emitToClientAndRoom(data, board);
		} catch (err) {
			emitter.emitFailure(data);
		}
	}

	@SubscribeMessage('update-board-title-request')
	@TrackExecutionTime()
	@EnsureRequestContext()
	public async updateBoardTitle(socket: Socket, data: UpdateBoardTitleMessageParams): Promise<void> {
		const emitter = this.buildBoardSocketEmitter({ socket, action: 'update-board-title' });
		const { userId } = this.getCurrentUser(socket);
		try {
			const board = await this.boardUc.updateBoardTitle(userId, data.boardId, data.newTitle);
			emitter.emitToClientAndRoom(data, board);
		} catch (err) {
			emitter.emitFailure(data);
		}
	}

	@SubscribeMessage('update-card-title-request')
	@TrackExecutionTime()
	@EnsureRequestContext()
	public async updateCardTitle(socket: Socket, data: UpdateCardTitleMessageParams): Promise<void> {
		const emitter = this.buildBoardSocketEmitter({ socket, action: 'update-card-title' });
		const { userId } = this.getCurrentUser(socket);
		try {
			const card = await this.cardUc.updateCardTitle(userId, data.cardId, data.newTitle);
			emitter.emitToClientAndRoom(data, card);
		} catch (err) {
			emitter.emitFailure(data);
		}
	}

	@SubscribeMessage('update-card-height-request')
	@TrackExecutionTime()
	@EnsureRequestContext()
	public async updateCardHeight(socket: Socket, data: UpdateCardHeightMessageParams): Promise<void> {
		const emitter = this.buildBoardSocketEmitter({ socket, action: 'update-card-height' });
		const { userId } = this.getCurrentUser(socket);
		try {
			const card = await this.cardUc.updateCardHeight(userId, data.cardId, data.newHeight);
			emitter.emitToClientAndRoom(data, card);
		} catch (err) {
			emitter.emitFailure(data);
		}
	}

	@SubscribeMessage('delete-card-request')
	@TrackExecutionTime()
	@EnsureRequestContext()
	public async deleteCard(socket: Socket, data: DeleteCardMessageParams): Promise<void> {
		const emitter = this.buildBoardSocketEmitter({ socket, action: 'delete-card' });
		const { userId } = this.getCurrentUser(socket);
		try {
			const rootId = await this.cardUc.deleteCard(userId, data.cardId);
			emitter.emitToClientAndRoom(data, rootId);
		} catch (err) {
			emitter.emitFailure(data);
		}
	}

	@SubscribeMessage('create-card-request')
	@TrackExecutionTime()
	@EnsureRequestContext()
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
	}

	@SubscribeMessage('create-column-request')
	@TrackExecutionTime()
	@EnsureRequestContext()
	public async createColumn(socket: Socket, data: CreateColumnMessageParams): Promise<object> {
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
	@EnsureRequestContext()
	public async fetchBoard(socket: Socket, data: FetchBoardMessageParams): Promise<void> {
		const emitter = this.buildBoardSocketEmitter({ socket, action: 'fetch-board' });
		const { userId } = this.getCurrentUser(socket);
		try {
			const { board, features, permissions, allowedOperations } = await this.boardUc.findBoard(userId, data.boardId);
			const responsePayload = BoardResponseMapper.mapToResponse(board, features, permissions, allowedOperations);
			await emitter.joinRoom(board);
			emitter.emitSuccess(responsePayload);
		} catch (err) {
			emitter.emitFailure(data);
		}
	}

	@SubscribeMessage('move-card-request')
	@TrackExecutionTime()
	@EnsureRequestContext()
	public async moveCard(socket: Socket, data: MoveCardMessageParams): Promise<void> {
		const emitter = this.buildBoardSocketEmitter({ socket, action: 'move-card' });
		const { userId } = this.getCurrentUser(socket);
		try {
			const { toBoard } = await this.columnUc.moveCard(userId, data.cardId, data.toColumnId, data.newIndex);
			emitter.emitToClientAndRoom(data, toBoard.id);
		} catch (err) {
			emitter.emitFailure(data);
		}
	}

	@SubscribeMessage('move-card-to-board-request')
	@TrackExecutionTime()
	@EnsureRequestContext()
	public async moveCardToBoard(socket: Socket, data: MoveCardToBoardMessageParams): Promise<void> {
		const emitter = this.buildBoardSocketEmitter({ socket, action: 'move-card-to-board' });
		const { userId } = this.getCurrentUser(socket);
		try {
			const resultData = await this.columnUc.moveCard(userId, data.cardId, data.toColumnId);
			const result = MoveCardResponseMapper.mapToReponse(resultData);
			const payload = {
				...result,
				forceNextTick: data.forceNextTick,
			};
			emitter.emitToClient(payload);
			if (result.fromBoard.id === result.toBoard.id) {
				emitter.emitToRoom(payload, result.fromBoard.id);
			} else {
				emitter.emitToRoom(payload, result.toBoard.id);
			}
		} catch (err) {
			emitter.emitFailure(data);
		}
	}

	@SubscribeMessage('duplicate-card-request')
	@TrackExecutionTime()
	@EnsureRequestContext()
	public async copyCard(socket: Socket, data: CopyCardMessageParams): Promise<void> {
		const emitter = this.buildBoardSocketEmitter({ socket, action: 'duplicate-card' });
		const { userId, schoolId } = this.getCurrentUser(socket);
		try {
			const card = await this.columnUc.copyCard(userId, data.cardId, schoolId);

			const cardResponse = CardResponseMapper.mapToResponse(card);
			const responsePayload = {
				...data,
				duplicatedCard: cardResponse,
			};
			emitter.emitToClientAndRoom(responsePayload, card);
		} catch (err) {
			emitter.emitFailure(data);
		}
	}

	@SubscribeMessage('move-column-request')
	@TrackExecutionTime()
	@EnsureRequestContext()
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
	}

	@SubscribeMessage('update-column-title-request')
	@TrackExecutionTime()
	@EnsureRequestContext()
	public async updateColumnTitle(socket: Socket, data: UpdateColumnTitleMessageParams): Promise<void> {
		const emitter = this.buildBoardSocketEmitter({ socket, action: 'update-column-title' });
		const { userId } = this.getCurrentUser(socket);
		try {
			const column = await this.columnUc.updateColumnTitle(userId, data.columnId, data.newTitle);
			emitter.emitToClientAndRoom(data, column);
		} catch (err) {
			emitter.emitFailure(data);
		}
	}

	@SubscribeMessage('update-readers-can-edit-request')
	@TrackExecutionTime()
	@EnsureRequestContext()
	public async updateReadersCanEdit(socket: Socket, data: UpdateReadersCanEditMessageParams): Promise<void> {
		const emitter = this.buildBoardSocketEmitter({ socket, action: 'update-readers-can-edit' });
		const { userId } = this.getCurrentUser(socket);
		try {
			const board = await this.boardUc.updateReadersCanEdit(userId, data.boardId, data.readersCanEdit);
			emitter.emitToClientAndRoom(data, board);
		} catch (err) {
			emitter.emitFailure(data);
		}
	}

	@SubscribeMessage('update-board-visibility-request')
	@TrackExecutionTime()
	@EnsureRequestContext()
	public async updateBoardVisibility(socket: Socket, data: UpdateBoardVisibilityMessageParams): Promise<void> {
		const emitter = this.buildBoardSocketEmitter({ socket, action: 'update-board-visibility' });
		const { userId } = this.getCurrentUser(socket);
		try {
			const board = await this.boardUc.updateVisibility(userId, data.boardId, data.isVisible);
			emitter.emitToClientAndRoom(data, board);
		} catch (err) {
			emitter.emitFailure(data);
		}
	}

	@SubscribeMessage('update-board-layout-request')
	@TrackExecutionTime()
	@EnsureRequestContext()
	public async updateBoardLayout(socket: Socket, data: UpdateBoardLayoutMessageParams): Promise<void> {
		const emitter = this.buildBoardSocketEmitter({ socket, action: 'update-board-layout' });
		const { userId } = this.getCurrentUser(socket);
		try {
			const board: ColumnBoard = await this.boardUc.updateLayout(userId, data.boardId, data.layout);
			emitter.emitToClientAndRoom(data, board);
		} catch (err) {
			emitter.emitFailure(data);
		}
	}

	@SubscribeMessage('delete-column-request')
	@TrackExecutionTime()
	@EnsureRequestContext()
	public async deleteColumn(socket: Socket, data: DeleteColumnMessageParams): Promise<void> {
		const emitter = this.buildBoardSocketEmitter({ socket, action: 'delete-column' });
		const { userId } = this.getCurrentUser(socket);
		try {
			const rootId = await this.columnUc.deleteColumn(userId, data.columnId);
			emitter.emitToClientAndRoom(data, rootId);
		} catch (err) {
			emitter.emitFailure(data);
		}
	}

	@SubscribeMessage('fetch-card-request')
	@TrackExecutionTime()
	@EnsureRequestContext()
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
	}

	@SubscribeMessage('create-element-request')
	@TrackExecutionTime()
	@EnsureRequestContext()
	public async createElement(
		socket: Socket,
		data: CreateContentElementMessageParams
	): Promise<AnyContentElementResponse | undefined> {
		const emitter = this.buildBoardSocketEmitter({ socket, action: 'create-element' });
		const { userId } = this.getCurrentUser(socket);
		let response: AnyContentElementResponse | undefined;

		try {
			const element = await this.cardUc.createElement(userId, data.cardId, data.type, data.toPosition);

			const responsePayload = {
				...data,
				newElement: ContentElementResponseFactory.mapToResponse(element),
			};
			emitter.emitToClientAndRoom(responsePayload, element);

			response = responsePayload.newElement;
		} catch (err) {
			emitter.emitFailure(data);
		}

		return response;
	}

	@SubscribeMessage('update-element-request')
	@TrackExecutionTime()
	@EnsureRequestContext()
	public async updateElement(socket: Socket, data: UpdateContentElementMessageParams): Promise<void> {
		const emitter = this.buildBoardSocketEmitter({ socket, action: 'update-element' });
		const { userId } = this.getCurrentUser(socket);
		try {
			const element = await this.elementUc.updateElement(userId, data.elementId, data.data.content);
			emitter.emitToClientAndRoom(data, element);
		} catch (err) {
			emitter.emitFailure(data);
		}
	}

	@SubscribeMessage('delete-element-request')
	@TrackExecutionTime()
	@EnsureRequestContext()
	public async deleteElement(socket: Socket, data: DeleteContentElementMessageParams): Promise<void> {
		const emitter = this.buildBoardSocketEmitter({ socket, action: 'delete-element' });
		const { userId } = this.getCurrentUser(socket);

		try {
			const rootId = await this.elementUc.deleteElement(userId, data.elementId);
			emitter.emitToClientAndRoom(data, rootId);
		} catch (err) {
			emitter.emitFailure(data);
		}
	}

	@SubscribeMessage('move-element-request')
	@TrackExecutionTime()
	@EnsureRequestContext()
	public async moveElement(socket: Socket, data: MoveContentElementMessageParams): Promise<void> {
		const emitter = this.buildBoardSocketEmitter({ socket, action: 'move-element' });
		const { userId } = this.getCurrentUser(socket);

		try {
			const element = await this.cardUc.moveElement(userId, data.elementId, data.toCardId, data.toPosition);
			emitter.emitToClientAndRoom(data, element);
		} catch (err) {
			emitter.emitFailure(data);
		}
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
			emitToClient(data: object): void {
				socket.emit(`${action}-success`, { ...data, isOwnAction: true });
			},
			emitToRoom(data: object, boardNodeOrRootId: AnyBoardNode | EntityId): void {
				const room = getRoomName(boardNodeOrRootId);
				socket.to(room).emit(`${action}-success`, { ...data, isOwnAction: false });
			},
			emitFailure(data: object): void {
				socket.emit(`${action}-failure`, data);
			},
		};
	}
}
