import { WebSocketGateway, SubscribeMessage, OnGatewayConnection, OnGatewayInit } from '@nestjs/websockets';
import { LegacyLogger } from '@src/core/logger';
import { Socket } from 'socket.io';
import cookie from 'cookie';
import { Request } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
// import { Authenticate } from '@src/modules/authentication';
// import { ColumnUc } from '../uc';
// @Authenticate('jwt')
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
export class SocketGateway implements OnGatewayInit, OnGatewayConnection {
	// TODO: use loggables instead of legacy logger
	constructor(
		private readonly logger: LegacyLogger // private readonly boardUc: BoardUc // private readonly columnUc: ColumnUc
	) {}

	public async handleConnection(client: Socket, request: Request): Promise<void> {
		this.logger.log('New connection');
		await this.authorizeConnection(client);

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

	public afterInit(): void {
		this.logger.log('Socket gateway initialized');
	}

	@SubscribeMessage('update-card-request')
	handleUpdateCard(client: Socket, data: unknown) {
		this.logger.log(`Message received from client id: ${client.id}`);
		this.logger.debug(`Payload: ${JSON.stringify(data)}`);
		client.broadcast.emit('update-card-success', data);
		client.emit('update-card-success', data);
	}

	@SubscribeMessage('lock-card-request')
	handleLockCard(client: Socket, data: unknown) {
		this.logger.log(`Message received from client id: ${client.id}`);
		this.logger.debug(`Payload: ${JSON.stringify(data)}`);
		client.broadcast.emit('lock-card-success', data);
		client.emit('lock-card-success', data);
	}

	@SubscribeMessage('unlock-card-request')
	handleUnlockCard(client: Socket, data: unknown) {
		this.logger.log(`Message received from client id: ${client.id}`);
		this.logger.debug(`Payload: ${JSON.stringify(data)}`);
		client.broadcast.emit('unlock-card-success', data);
		client.emit('unlock-card-success', data);
	}

	@SubscribeMessage('delete-card-request')
	handleDeleteCard(client: Socket, data: unknown) {
		this.logger.log(`Message received from client id: ${client.id}`);
		this.logger.debug(`Payload: ${JSON.stringify(data)}`);
		client.broadcast.emit('delete-card-success', data);
		client.emit('delete-card-success', data);
	}

	@SubscribeMessage('create-card-request')
	handleCreateCard(client: Socket, data: Record<string, unknown>) {
		this.logger.log(`Message received from client id: ${client.id}`);
		this.logger.debug(`Payload: ${JSON.stringify(data)}`);

		// const { requiredEmptyElements } = createCardBodyParams || {};
		// const card = await this.columnUc.createCard(currentUser.userId, urlParams.columnId, requiredEmptyElements);

		// const response = CardResponseMapper.mapToResponse(card);

		const cardId = `card${Math.floor(Math.random() * 1000)}`;
		const responsePayload = {
			...data,
			cardId,
			text: '',
		};
		this.logger.debug(`Response Payload: ${JSON.stringify(responsePayload)}`);

		client.broadcast.emit('create-card-success', responsePayload);
		client.emit('create-card-success', responsePayload);
	}

	@SubscribeMessage('move-card-request')
	handleMoveCard(client: Socket, data: Record<string, unknown>) {
		this.logger.log(`Message received from client id: ${client.id}`);
		this.logger.debug(`Payload: ${JSON.stringify(data)}`);
		client.broadcast.emit('move-card-success', data);
	}

	@SubscribeMessage('move-column-request')
	handleMoveColumn(client: Socket, data: Record<string, unknown>) {
		this.logger.log(`Message received from client id: ${client.id}`);
		this.logger.debug(`Payload: ${JSON.stringify(data)}`);
		client.broadcast.emit('move-column-success', data);
	}

	@SubscribeMessage('update-board-title-request')
	handleChangeBoardTitle(client: Socket, data: Record<string, unknown>) {
		this.logger.log(`Message received from client id: ${client.id}`);
		this.logger.debug(`Payload: ${JSON.stringify(data)}`);
		client.broadcast.emit('update-board-title-success', data);
	}

	@SubscribeMessage('update-column-title-request')
	handleChangeColumnTitle(client: Socket, data: Record<string, unknown>) {
		this.logger.log(`Message received from client id: ${client.id}`);
		this.logger.debug(`Payload: ${JSON.stringify(data)}`);
		client.broadcast.emit('update-column-title-success', data);
	}

	@SubscribeMessage('update-board-visibility-request')
	handleBoardVisibility(client: Socket, data: Record<string, unknown>) {
		this.logger.log(`Message received from client id: ${client.id}`);
		this.logger.debug(`Payload: ${JSON.stringify(data)}`);
		client.broadcast.emit('update-board-visibility-success', data);
	}
}
