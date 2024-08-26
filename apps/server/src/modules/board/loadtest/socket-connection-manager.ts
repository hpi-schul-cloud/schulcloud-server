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
			const batchAmount = Math.min(10, amount - connections.length);
			const promises = Array(batchAmount)
				.fill(1)
				.map(() => this.createConnection());

			const allSettled = await Promise.allSettled(promises);
			allSettled.forEach((res) => {
				if (res.status === 'fulfilled') {
					connections.push(res.value);
				} else {
					/* istanbul ignore next */
					this.onErrorHandler('failed to create connection');
				}
			});
			await sleep(1000);
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
		await Promise.all(promises);
	}
}
