import { WebSocketGateway, SubscribeMessage } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ cors: true })
export class SocketGateway {
	private readonly logger = new Logger(SocketGateway.name);

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
}
