import { sleep } from './helper/sleep';
import { SocketConnection } from './SocketConnection';
import { SocketConfiguration } from './types';

export class SocketConnectionManager {
	private connections: SocketConnection[];

	private socketConfiguration: SocketConfiguration;

	constructor(socketConfiguration: SocketConfiguration) {
		this.connections = [];
		this.socketConfiguration = socketConfiguration;
	}

	async createConnection(): Promise<SocketConnection> {
		const socket = new SocketConnection(this.socketConfiguration);
		await socket.connect();
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
					this.connections.push(res.value);
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

	async destroySocketConnections(sockets: SocketConnection[]) {
		const promises = sockets.map((socket) => socket.close());
		await Promise.all(promises);
	}
}
