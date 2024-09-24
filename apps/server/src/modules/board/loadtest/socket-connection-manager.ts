/* eslint-disable no-await-in-loop */
import { sleep } from './helper/sleep';
import { SocketConnection } from './socket-connection';
import { Callback, SocketConfiguration } from './types';

export class SocketConnectionManager {
	private connections: SocketConnection[];

	private socketConfiguration: SocketConfiguration;

	private onErrorHandler: Callback = console.log;

	constructor(socketConfiguration: SocketConfiguration) {
		this.connections = [];
		this.socketConfiguration = socketConfiguration;
	}

	async createConnection(): Promise<SocketConnection> {
		// eslint-disable-next-line arrow-body-style
		const socket = new SocketConnection(this.socketConfiguration, (errorMessage: unknown) => {
			/* istanbul ignore next */
			return this.onErrorHandler(errorMessage);
		});
		await socket.connect();

		this.connections.push(socket);
		return socket;
	}

	async createConnections(amount: number): Promise<SocketConnection[]> {
		const connections: SocketConnection[] = [];

		while (connections.length < amount) {
			const connection = await this.createConnection();
			connections.push(connection);
			await sleep(100);
		}
		return connections;
	}

	getClientCount() {
		return this.connections.length;
	}

	setOnErrorHandler(onErrorHandler: Callback) {
		/* istanbul ignore next */
		this.onErrorHandler = onErrorHandler;
	}

	async destroySocketConnections() {
		const promises = this.connections.map((connection) => connection.close());
		this.connections = [];
		await Promise.all(promises);
	}
}
