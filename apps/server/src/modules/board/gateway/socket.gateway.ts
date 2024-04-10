import {
	WebSocketGateway,
	// OnGatewayConnection,
	// WebSocketServer,
	SubscribeMessage,
	// OnGatewayDisconnect,
	// OnGatewayInit,
} from '@nestjs/websockets';
// import { Server, Socket } from 'socket.io';
import { Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ cors: true })
// export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
export class SocketGateway {
	private readonly logger = new Logger(SocketGateway.name);

	// @WebSocketServer()
	// io: Server;

	// afterInit() {
	// 	this.logger.log('Initialized');
	// }

	// handleConnection(client: Socket) {
	// 	const { sockets } = this.io.sockets;
	// 	this.logger.log(`Client id: ${client.id} connected`);
	// 	this.logger.debug(`Number of connected clients: ${sockets.size}`);
	// }

	// handleDisconnect(client: Socket) {
	// 	this.logger.log(`Cliend id:${client.id} disconnected`);
	// }

	@SubscribeMessage('update-card')
	handleUpdateCard(client: Socket, data: unknown) {
		this.logger.log(`Message received from client id: ${client.id}`);
		this.logger.debug(`Payload: ${JSON.stringify(data)}`);
		client.broadcast.emit('update-card', data);
	}

	@SubscribeMessage('lock-card')
	handleLockCard(client: Socket, data: unknown) {
		this.logger.log(`Message received from client id: ${client.id}`);
		this.logger.debug(`Payload: ${JSON.stringify(data)}`);
		client.broadcast.emit('lock-card', data);
	}

	@SubscribeMessage('unlock-card')
	handleUnlockCard(client: Socket, data: unknown) {
		this.logger.log(`Message received from client id: ${client.id}`);
		this.logger.debug(`Payload: ${JSON.stringify(data)}`);
		client.broadcast.emit('unlock-card', data);
	}
}
