import { UseRequestContext } from '@mikro-orm/core';
import { UseGuards } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WsException } from '@nestjs/websockets';
import { AnyBoardDo } from '@shared/domain/domainobject';
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
			const result = await this.boardUc.deleteBoard(userId, data.boardId);
			const rootId = await this.getRootIdForBoardDo(result);
			await this.ensureClientInRoom(client, rootId);
			client.to(rootId).emit('delete-board-success', data);
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
			const result = await this.boardUc.updateBoardTitle(userId, data.boardId, data.newTitle);
			const rootId = await this.getRootIdForBoardDo(result);
			await this.ensureClientInRoom(client, rootId);
			client.to(rootId).emit('update-board-title-success', data);
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
		const { userId } = this.getCurrentUser(client);
		const card = await this.columnUc.createCard(userId, data.columnId);
		const responsePayload = {
			...data,
			newCard: card.getProps(),
		};

		const rootId = await this.getRootIdForBoardDo(card);
		await this.ensureClientInRoom(client, rootId);
		client.to(rootId).emit('create-card-success', responsePayload);
		client.emit('create-card-success', responsePayload);
	}

	@SubscribeMessage('create-column-request')
	@UseRequestContext()
	async handleCreateColumn(client: Socket, data: CreateColumnMessageParams) {
		const { userId } = this.getCurrentUser(client);
		const column = await this.boardUc.createColumn(userId, data.boardId);
		const responsePayload = {
			...data,
			newColumn: column.getProps(),
		};

		const rootId = await this.getRootIdForBoardDo(column);
		await this.ensureClientInRoom(client, rootId);
		client.to(rootId).emit('create-column-success', responsePayload);
		client.emit('create-column-success', responsePayload);

		// payload needs to be returned to allow the client to do sequential operation
		// of createColumn and move the card into that column
		return responsePayload;
	}

	@SubscribeMessage('fetch-board-request')
	@UseRequestContext()
	async handleFetchBoard(client: Socket, data: FetchBoardMessageParams) {
		try {
			const { userId } = this.getCurrentUser(client);
			const board = await this.boardUc.findBoard(userId, data.boardId);

			const responsePayload = {
				board: BoardResponseMapper.mapToResponse(board),
			};

			const rootId = await this.getRootIdForBoardDo(board);
			await this.ensureClientInRoom(client, rootId);
			client.to(rootId).emit('fetch-board-success', responsePayload);
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
			const result = await this.columnUc.moveCard(userId, data.cardId, data.toColumnId, data.newIndex);
			const rootId = await this.getRootIdForBoardDo(result);
			await this.ensureClientInRoom(client, rootId);
			client.to(rootId).emit('move-card-success', data);
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
			const result = await this.boardUc.moveColumn(
				userId,
				data.columnMove.columnId,
				data.targetBoardId,
				data.columnMove.addedIndex
			);
			const rootId = await this.getRootIdForBoardDo(result);
			client.to(rootId).emit('move-column-success', data);
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
			const result = await this.columnUc.updateColumnTitle(userId, data.columnId, data.newTitle);
			const rootId = await this.getRootIdForBoardDo(result);
			await this.ensureClientInRoom(client, rootId);
			client.to(rootId).emit('update-column-title-success', data);
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
			const result = await this.boardUc.updateVisibility(userId, data.boardId, data.isVisible);
			const rootId = await this.getRootIdForBoardDo(result);
			await this.ensureClientInRoom(client, rootId);
			client.broadcast.emit('update-board-visibility-success', {});
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
			const result = await this.columnUc.deleteColumn(userId, data.columnId);
			const rootId = await this.getRootIdForBoardDo(result);
			await this.ensureClientInRoom(client, rootId);
			client.to(rootId).emit('delete-column-success', data);
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

	private async getRootIdForBoardDo(anyBoardDo: AnyBoardDo) {
		/* return anyDo.ancestorIds[0] */

		const authorizable = await this.authorizableService.getBoardAuthorizable(anyBoardDo);
		const rootId = authorizable.rootDo.id;

		return rootId;
	}

	private async ensureClientInRoom(client: Socket, room: string) {
		await client.join(room);
	}
}
