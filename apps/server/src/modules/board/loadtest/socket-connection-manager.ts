import { sleep } from './helper/sleep';
import { SocketConnection } from './socket-connection';
import { type Callback, type SocketConfiguration } from './types';

export class SocketConnectionManager {
	private connections: SocketConnection[] = [];
	private onErrorHandler: Callback = console.log;

	constructor(private readonly socketConfiguration: SocketConfiguration) {}

	public async createConnection(): Promise<SocketConnection> {
		// eslint-disable-next-line arrow-body-style
		const socket = new SocketConnection(this.socketConfiguration, (errorMessage: unknown) => {
			/* istanbul ignore next */
			return this.onErrorHandler(errorMessage);
		});
		await socket.connect();

		this.connections.push(socket);
		return socket;
	}

	public async createConnections(amount: number): Promise<SocketConnection[]> {
		const connections: SocketConnection[] = [];

		while (connections.length < amount) {
			const connection = await this.createConnection();
			connections.push(connection);
			await sleep(100);
		}
		return connections;
	}

	public getClientCount(): number {
		return this.connections.length;
	}

	public setOnErrorHandler(onErrorHandler: Callback): void {
		/* istanbul ignore next */
		this.onErrorHandler = onErrorHandler;
	}

	public destroySocketConnections(): void {
		this.connections.forEach((connection) => connection.close());
		this.connections = [];
	}
}
