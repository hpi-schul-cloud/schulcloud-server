import { Socket, WsValidationPipe } from '@infra/socketio';
import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { WsJwtAuthGuard } from '@modules/authentication';
import { UseGuards, UsePipes } from '@nestjs/common';
import {
	OnGatewayDisconnect,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
	WsException,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import {
	BoardResponseMapper,
	CardResponseMapper,
	ColumnResponseMapper,
	ContentElementResponseFactory,
} from '../controller/mapper';
import { MetricsService } from '../metrics/metrics.service';
import { TrackExecutionTime } from '../metrics/track-execution-time.decorator';
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
import { AnyBoardNode } from '../domain';

@UsePipes(new WsValidationPipe())
@WebSocketGateway(BoardCollaborationConfiguration.websocket)
@UseGuards(WsJwtAuthGuard)
export class BoardCollaborationGateway implements OnGatewayDisconnect {
	@WebSocketServer()
	server!: Server;

	// TODO: use loggables instead of legacy logger
	constructor(
		private readonly orm: MikroORM,
		private readonly boardUc: BoardUc,
		private readonly columnUc: ColumnUc,
		private readonly cardUc: CardUc,
		private readonly elementUc: ElementUc,
		private readonly metricsService: MetricsService
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
	async deleteBoard(socket: Socket, data: DeleteBoardMessageParams) {
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
	async updateBoardTitle(socket: Socket, data: UpdateBoardTitleMessageParams) {
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
	async updateCardTitle(socket: Socket, data: UpdateCardTitleMessageParams) {
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
	@UseRequestContext()
	async updateCardHeight(socket: Socket, data: UpdateCardHeightMessageParams) {
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
	@UseRequestContext()
	async deleteCard(socket: Socket, data: DeleteCardMessageParams) {
		const emitter = this.buildBoardSocketEmitter({ socket, action: 'delete-card' });
		const { userId } = this.getCurrentUser(socket);
		try {
			const card = await this.cardUc.deleteCard(userId, data.cardId);
			emitter.emitToClientAndRoom(data, card);
		} catch (err) {
			emitter.emitFailure(data);
		}
		await this.updateRoomsAndUsersMetrics(socket);
	}

	@SubscribeMessage('create-card-request')
	@TrackExecutionTime()
	@UseRequestContext()
	async createCard(socket: Socket, data: CreateCardMessageParams) {
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
	@UseRequestContext()
	async createColumn(socket: Socket, data: CreateColumnMessageParams) {
		const emitter = this.buildBoardSocketEmitter({ socket, action: 'create-column' });
		const { userId } = this.getCurrentUser(socket);
		try {
			const column = await this.boardUc.createColumn(userId, data.boardId);

			const newColumn = ColumnResponseMapper.mapToResponse(column);
			const responsePayload = {
				...data,
				newColumn,
			};
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
	async fetchBoard(socket: Socket, data: FetchBoardMessageParams) {
		const emitter = this.buildBoardSocketEmitter({ socket, action: 'fetch-board' });
		const { userId } = this.getCurrentUser(socket);
		try {
			const board = await this.boardUc.findBoard(userId, data.boardId);
			const responsePayload = BoardResponseMapper.mapToResponse(board);
			await emitter.joinRoom(board);
			emitter.emitSuccess(responsePayload);
		} catch (err) {
			emitter.emitFailure(data);
		}
		await this.updateRoomsAndUsersMetrics(socket);
	}

	@SubscribeMessage('move-card-request')
	@UseRequestContext()
	async moveCard(socket: Socket, data: MoveCardMessageParams) {
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
	@UseRequestContext()
	async moveColumn(socket: Socket, data: MoveColumnMessageParams) {
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
	async updateColumnTitle(socket: Socket, data: UpdateColumnTitleMessageParams) {
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
	@UseRequestContext()
	async updateBoardVisibility(socket: Socket, data: UpdateBoardVisibilityMessageParams) {
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

	@SubscribeMessage('delete-column-request')
	@UseRequestContext()
	async deleteColumn(socket: Socket, data: DeleteColumnMessageParams) {
		const emitter = this.buildBoardSocketEmitter({ socket, action: 'delete-column' });
		const { userId } = this.getCurrentUser(socket);
		try {
			const column = await this.columnUc.deleteColumn(userId, data.columnId);
			emitter.emitToClientAndRoom(data, column);
		} catch (err) {
			emitter.emitFailure(data);
		}
		await this.updateRoomsAndUsersMetrics(socket);
	}

	@SubscribeMessage('fetch-card-request')
	@TrackExecutionTime()
	@UseRequestContext()
	async fetchCards(socket: Socket, data: FetchCardsMessageParams) {
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
	@UseRequestContext()
	async createElement(socket: Socket, data: CreateContentElementMessageParams) {
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
	async updateElement(socket: Socket, data: UpdateContentElementMessageParams) {
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
	@UseRequestContext()
	async deleteElement(socket: Socket, data: DeleteContentElementMessageParams) {
		const emitter = this.buildBoardSocketEmitter({ socket, action: 'delete-element' });
		const { userId } = this.getCurrentUser(socket);

		try {
			const element = await this.elementUc.deleteElement(userId, data.elementId);
			emitter.emitToClientAndRoom(data, element);
		} catch (err) {
			emitter.emitFailure(data);
		}
		await this.updateRoomsAndUsersMetrics(socket);
	}

	@SubscribeMessage('move-element-request')
	@UseRequestContext()
	async moveElement(socket: Socket, data: MoveContentElementMessageParams) {
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
		const getRootId = (domainobject: AnyBoardNode) => domainobject.rootId;
		return {
			async joinRoom(boardNode: AnyBoardNode) {
				const rootId = getRootId(boardNode);
				const room = `board_${rootId}`;
				await socket.join(room);
			},
			emitSuccess(data: object) {
				socket.emit(`${action}-success`, { ...data, isOwnAction: true });
			},
			emitToClientAndRoom(data: object, boardNode: AnyBoardNode) {
				const rootId = getRootId(boardNode);
				const room = `board_${rootId}`;

				socket.to(room).emit(`${action}-success`, { ...data, isOwnAction: false });
				socket.emit(`${action}-success`, { ...data, isOwnAction: true });
			},
			emitFailure(data: object) {
				socket.emit(`${action}-failure`, data);
			},
		};
	}
}
