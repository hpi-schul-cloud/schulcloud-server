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
		const socket = new SocketConnection(this.socketConfiguration, (errorMessage: unknown) =>
			this.onErrorHandler(errorMessage)
		);
		await socket.connect();

		this.connections.push(socket);
		return socket;
	}

	async createConnections(amount: number): Promise<SocketConnection[]> {
		const connections: SocketConnection[] = [];

		while (connections.length < amount) {
			const batchAmount = Math.min(100, amount - connections.length);
			const promises = Array(batchAmount)
				.fill(1)
				.map(() => this.createConnection());

			// eslint-disable-next-line no-await-in-loop
			const allSettled = await Promise.allSettled(promises);
			allSettled.forEach((res) => {
				if (res.status === 'fulfilled') {
					connections.push(res.value);
				} else {
					this.onErrorHandler('failed to create connection');
				}
			});
			console.log(`created ${connections.length} connections`);
			// eslint-disable-next-line no-await-in-loop
			await sleep(1000);
		}
		return connections;
	}

	getClientCount() {
		return this.connections.length;
	}

	setOnErrorHandler(onErrorHandler: Callback) {
		this.onErrorHandler = onErrorHandler;
	}

	async destroySocketConnections(sockets: SocketConnection[]) {
		const promises = sockets.map((socket) => socket.close());
		await Promise.all(promises);
	}
}
