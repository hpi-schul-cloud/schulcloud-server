import { WebSocketGateway, SubscribeMessage } from '@nestjs/websockets';
import { LegacyLogger } from '@src/core/logger';
import { Socket } from 'socket.io';

@WebSocketGateway({
	path: '/collaboration',
	cors: {
		origin: '*',
		methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
		preflightContinue: false,
		optionsSuccessStatus: 204,
		// credentials: true, // TODO: check how this works
		// transports: ['websocket'],
	},
})
export class SocketGateway {
	// TODO: use loggables instead of legacy logger
	constructor(private readonly logger: LegacyLogger) {}

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
}
