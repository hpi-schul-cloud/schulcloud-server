import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { UseGuards } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WsException } from '@nestjs/websockets';
import { LegacyLogger } from '@src/core/logger';
import { WsJwtAuthGuard } from '@src/modules/authentication/guard/ws-jwt-auth.guard';
import { BoardResponseMapper } from '../controller/mapper';
import { BoardDoAuthorizableService } from '../service';
import { BoardUc, ColumnUc } from '../uc';
import {
	CreateCardMessageParams,
	DeleteColumnMessageParams,
	MoveCardMessageParams,
	UpdateColumnTitleMessageParams,
} from './dto';
import { CreateColumnMessageParams } from './dto/create-column.message.param';
import { DeleteBoardMessageParams } from './dto/delete-board.message.param';
import { FetchBoardMessageParams } from './dto/fetch-board.message.param';
import { MoveColumnMessageParams } from './dto/move-column.message.param';
import { UpdateBoardTitleMessageParams } from './dto/update-board-title.message.param';
import { UpdateBoardVisibilityMessageParams } from './dto/update-board-visibility.message.param';
import { Socket } from './types';

@WebSocketGateway({
	path: '/collaboration',
	cors: {
		origin: 'http://localhost:4000',
		methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
		preflightContinue: false,
		optionsSuccessStatus: 204,
		credentials: true,
		// transports: ['websocket'],
	},
})
@UseGuards(WsJwtAuthGuard)
export class SocketGateway {
	// TODO: use loggables instead of legacy logger
	constructor(
		private readonly logger: LegacyLogger,
		private readonly orm: MikroORM,
		private readonly boardUc: BoardUc,
		private readonly columnUc: ColumnUc,
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
	async handleDeleteBoard(client: Socket, data: DeleteBoardMessageParams) {
		try {
			const { userId } = this.getCurrentUser(client);
			const room = await this.ensureUserInRoom(client, data.boardId);
			await this.boardUc.deleteBoard(userId, data.boardId);

			client.to(room).emit('delete-board-success', data);
			client.emit('delete-board-success', data);
		} catch (err) {
			client.emit('delete-board-failure', new Error('Failed to delete board'));
		}
	}

	@SubscribeMessage('update-board-title-request')
	@UseRequestContext()
	async handleChangeBoardTitle(client: Socket, data: UpdateBoardTitleMessageParams) {
		try {
			const { userId } = this.getCurrentUser(client);
			await this.boardUc.updateBoardTitle(userId, data.boardId, data.newTitle);

			const room = await this.ensureUserInRoom(client, data.boardId);
			client.to(room).emit('update-board-title-success', data);
			client.emit('update-board-title-success', data);
		} catch (err) {
			client.emit('update-board-title-failure', new Error('Failed to update board title'));
		}
	}

	// @SubscribeMessage('update-card-request')
	// handleUpdateCard(client: Socket, data: unknown) {
	// 	this.logger.log(`Message received from client id: ${client.id}`);
	// 	this.logger.debug(`Payload: ${JSON.stringify(data)}`);
	// 	client.broadcast.emit('update-card-success', data);
	// 	client.emit('update-card-success', data);
	// }

	// @SubscribeMessage('delete-card-request')
	// handleDeleteCard(client: Socket, data: unknown) {
	// 	this.logger.log(`Message received from client id: ${client.id}`);
	// 	this.logger.debug(`Payload: ${JSON.stringify(data)}`);
	// 	client.broadcast.emit('delete-card-success', data);
	// 	client.emit('delete-card-success', data);
	// }

	@SubscribeMessage('create-card-request')
	@UseRequestContext()
	async handleCreateCard(client: Socket, data: CreateCardMessageParams) {
		try {
			const { userId } = this.getCurrentUser(client);
			const card = await this.columnUc.createCard(userId, data.columnId);
			const responsePayload = {
				...data,
				newCard: card.getProps(),
			};

			const room = await this.ensureUserInRoom(client, data.columnId);
			client.to(room).emit('create-card-success', responsePayload);
			client.emit('create-card-success', responsePayload);
		} catch (err) {
			client.emit('create-card-failure', new Error('Failed to create card'));
		}
	}

	@SubscribeMessage('create-column-request')
	@UseRequestContext()
	async handleCreateColumn(client: Socket, data: CreateColumnMessageParams) {
		try {
			const { userId } = this.getCurrentUser(client);
			const column = await this.boardUc.createColumn(userId, data.boardId);
			const responsePayload = {
				...data,
				newColumn: column.getProps(),
			};

			const room = await this.ensureUserInRoom(client, data.boardId);
			client.to(room).emit('create-column-success', responsePayload);
			client.emit('create-column-success', responsePayload);

			// payload needs to be returned to allow the client to do sequential operation
			// of createColumn and move the card into that column
			return responsePayload;
		} catch (err) {
			client.emit('create-column-failure', new Error('Failed to create column'));
			return {};
		}
	}

	@SubscribeMessage('fetch-board-request')
	@UseRequestContext()
	async handleFetchBoard(client: Socket, data: FetchBoardMessageParams) {
		try {
			const { userId } = this.getCurrentUser(client);
			const board = await this.boardUc.findBoard(userId, data.boardId);

			const responsePayload = BoardResponseMapper.mapToResponse(board);

			const room = await this.ensureUserInRoom(client, data.boardId);
			client.to(room).emit('fetch-board-success', responsePayload);
			client.emit('fetch-board-success', responsePayload);
		} catch (err) {
			client.emit('fetch-board-failure', new Error('Failed to fetch board'));
		}
	}

	@SubscribeMessage('move-card-request')
	@UseRequestContext()
	async handleMoveCard(client: Socket, data: MoveCardMessageParams) {
		try {
			const { userId } = this.getCurrentUser(client);
			await this.columnUc.moveCard(userId, data.cardId, data.toColumnId, data.newIndex);

			const room = await this.ensureUserInRoom(client, data.cardId);
			client.to(room).emit('move-card-success', data);
			client.emit('move-card-success', data);
		} catch (err) {
			client.emit('move-card-failure', new Error('Failed to move card'));
		}
	}

	@SubscribeMessage('move-column-request')
	@UseRequestContext()
	async handleMoveColumn(client: Socket, data: MoveColumnMessageParams) {
		try {
			const { userId } = this.getCurrentUser(client);
			await this.boardUc.moveColumn(userId, data.columnMove.columnId, data.targetBoardId, data.columnMove.addedIndex);

			const room = await this.ensureUserInRoom(client, data.columnId);
			client.to(room).emit('move-column-success', data);
			client.emit('move-column-success', data);
		} catch (err) {
			client.emit('move-column-failure', new Error('Failed to move column'));
		}
	}

	@SubscribeMessage('update-column-title-request')
	@UseRequestContext()
	async handleChangeColumnTitle(client: Socket, data: UpdateColumnTitleMessageParams) {
		try {
			const { userId } = this.getCurrentUser(client);
			await this.columnUc.updateColumnTitle(userId, data.columnId, data.newTitle);

			const room = await this.ensureUserInRoom(client, data.columnId);
			client.to(room).emit('update-column-title-success', data);
			client.emit('update-column-title-success', data);
		} catch (err) {
			client.emit('update-column-title-failure', new Error('Failed to update column title'));
		}
	}

	@SubscribeMessage('update-board-visibility-request')
	@UseRequestContext()
	async handleBoardVisibility(client: Socket, data: UpdateBoardVisibilityMessageParams) {
		try {
			const { userId } = this.getCurrentUser(client);
			await this.boardUc.updateVisibility(userId, data.boardId, data.isVisible);

			const room = await this.ensureUserInRoom(client, data.boardId);
			client.to(room).emit('update-board-visibility-success', {});
			client.emit('update-board-visibility-success', {});
		} catch (err) {
			client.emit('update-board-visibility-failure', new Error('Failed to update board visibility'));
		}
	}

	@SubscribeMessage('delete-column-request')
	@UseRequestContext()
	async handleDeleteColumn(client: Socket, data: DeleteColumnMessageParams) {
		try {
			const { userId } = this.getCurrentUser(client);
			const room = await this.ensureUserInRoom(client, data.columnId);
			await this.columnUc.deleteColumn(userId, data.columnId);

			client.to(room).emit('delete-column-success', data);
			client.emit('delete-column-success', data);
		} catch (err) {
			client.emit('delete-column-failure', new Error('Failed to delete column'));
		}
	}

	// @SubscribeMessage('reload-board-request')
	// handleReloadBoard(client: Socket, data: DeleteColumnMessageParams) {
	// 	this.logger.log(`Message received from client id: ${client.id}`);
	// 	this.logger.debug(`Payload: ${JSON.stringify(data)}`);
	// 	client.broadcast.emit('reload-board-success', data);
	// }

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
