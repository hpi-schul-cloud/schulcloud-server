import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { UseGuards } from '@nestjs/common';
import {
	OnGatewayConnection,
	OnGatewayInit,
	SubscribeMessage,
	WebSocketGateway,
	WsException,
} from '@nestjs/websockets';
import { AnyBoardDo } from '@shared/domain/domainobject';
import { LegacyLogger } from '@src/core/logger';
import { WsJwtAuthGuard } from '@src/modules/authentication/guard/ws-jwt-auth.guard';
import cookie from 'cookie';
import jwt, { JwtPayload } from 'jsonwebtoken';
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
export class SocketGateway implements OnGatewayInit, OnGatewayConnection {
	// TODO: use loggables instead of legacy logger
	constructor(
		private readonly logger: LegacyLogger,
		private readonly orm: MikroORM,
		private readonly boardUc: BoardUc,
		private readonly columnUc: ColumnUc,
		private readonly authorizableService: BoardDoAuthorizableService // to be removed
	) {}

	public handleConnection(/* client: Socket */): void {
		this.logger.log('New connection');
		/* await this.authorizeConnection(client); */

		// if (!this.configService.get<boolean>('FEATURE_TLDRAW_ENABLED')) {
		// 	client.close(WsCloseCode.BAD_REQUEST, WsCloseMessage.FEATURE_DISABLED);
		// 	return;
		// }

		// const docName = this.getDocNameFromRequest(request);
		// if (!docName) {
		// 	// 	client.close(WsCloseCode.BAD_REQUEST, WsCloseMessage.BAD_REQUEST);
		// 	return;
		// }

		try {
			// await this.authorizeConnection(cookies?.jwt);
			// await this.tldrawWsService.setupWsConnection(client, docName);
		} catch (err) {
			this.logger.error(err);
			// this.handleError(err, client, docName);
		}
	}

	// private getDocNameFromRequest(request: Request): string {
	// 	const urlStripped = request.url.replace(/(\/)|(tldraw-server)/g, '');
	// 	return urlStripped;
	// }

	private async authorizeConnection(client: Socket): Promise<void> {
		await Promise.resolve();
		const token = client.handshake.headers.cookie;
		if (token === undefined) {
			throw new Error('No token found in cookie');
		}
		const jwtPayload = this.getJwtPayload(token);
		this.logger.log('jwtPayload', JSON.stringify(jwtPayload));
		// TODO: validate token
		// TODO: check userid against...
	}

	private getJwtPayload(token: string): JwtPayload | null {
		const cookies = cookie.parse(token);
		if (cookies?.jwt) {
			return jwt.decode(cookies.jwt, { json: true });
		}
		return null;
	}

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
			this.logger.log(`Message received from client id: ${client.id}`);
			this.logger.debug(`Payload: ${JSON.stringify(data)}`);
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
			this.logger.log(`Message received from client id: ${client.id}`);
			this.logger.debug(`Payload: ${JSON.stringify(data)}`);
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

	@SubscribeMessage('update-card-request')
	handleUpdateCard(client: Socket, data: unknown) {
		this.logger.log(`Message received from client id: ${client.id}`);
		this.logger.debug(`Payload: ${JSON.stringify(data)}`);
		client.broadcast.emit('update-card-success', data);
		client.emit('update-card-success', data);
	}

	@SubscribeMessage('delete-card-request')
	handleDeleteCard(client: Socket, data: unknown) {
		this.logger.log(`Message received from client id: ${client.id}`);
		this.logger.debug(`Payload: ${JSON.stringify(data)}`);
		client.broadcast.emit('delete-card-success', data);
		client.emit('delete-card-success', data);
	}

	@SubscribeMessage('create-card-request')
	@UseRequestContext()
	async handleCreateCard(client: Socket, data: CreateCardMessageParams) {
		this.logger.log(`Message received from client id: ${client.id}`);
		this.logger.debug(`Payload: ${JSON.stringify(data)}`);
		const { userId } = this.getCurrentUser(client);
		const card = await this.columnUc.createCard(userId, data.columnId);
		const responsePayload = {
			...data,
			newCard: card.getProps(),
		};
		this.logger.debug(`Response Payload: ${JSON.stringify(responsePayload)}`);

		const rootId = await this.getRootIdForBoardDo(card);
		await this.ensureClientInRoom(client, rootId);
		client.to(rootId).emit('create-card-success', responsePayload);
		client.emit('create-card-success', responsePayload);
	}

	@SubscribeMessage('create-column-request')
	@UseRequestContext()
	async handleCreateColumn(client: Socket, data: CreateColumnMessageParams) {
		this.logger.log(`Message received from client id: ${client.id}`);
		this.logger.debug(`Payload: ${JSON.stringify(data)}`);
		const { userId } = this.getCurrentUser(client);
		const column = await this.boardUc.createColumn(userId, data.boardId);
		const responsePayload = {
			...data,
			newColumn: column.getProps(),
		};
		this.logger.debug(`Response Payload: ${JSON.stringify(responsePayload)}`);

		const rootId = await this.getRootIdForBoardDo(column);
		await this.ensureClientInRoom(client, rootId);
		client.to(rootId).emit('create-column-success', responsePayload);
		client.emit('create-column-success', responsePayload);
	}

	@SubscribeMessage('fetch-board-request')
	@UseRequestContext()
	async handleFetchBoard(client: Socket, data: FetchBoardMessageParams) {
		try {
			this.logger.log(`Message received from client id: ${client.id}`);
			this.logger.debug(`Payload: ${JSON.stringify(data)}`);
			const { userId } = this.getCurrentUser(client);
			const board = await this.boardUc.findBoard(userId, data.boardId);

			const responsePayload = {
				// ...data,
				board: BoardResponseMapper.mapToResponse(board),
			};
			this.logger.debug(`Response Payload: ${JSON.stringify(responsePayload)}`);

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
			this.logger.log(`Message received from client id: ${client.id}`);
			this.logger.debug(`Payload: ${JSON.stringify(data)}`);
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
			this.logger.log(`Message received from client id: ${client.id}`);
			this.logger.debug(`Payload: ${JSON.stringify(data)}`);
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
			this.logger.log(`Message received from client id: ${client.id}`);
			this.logger.debug(`Payload: ${JSON.stringify(data)}`);
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
			this.logger.log(`Message received from client id: ${client.id}`);
			this.logger.debug(`Payload: ${JSON.stringify(data)}`);
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
			this.logger.log(`Message received from client id: ${client.id}`);
			this.logger.debug(`Payload: ${JSON.stringify(data)}`);
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

	@SubscribeMessage('reload-board-request')
	handleReloadBoard(client: Socket, data: DeleteColumnMessageParams) {
		this.logger.log(`Message received from client id: ${client.id}`);
		this.logger.debug(`Payload: ${JSON.stringify(data)}`);
		client.broadcast.emit('reload-board-success', data);
	}

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
