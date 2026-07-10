/* eslint-disable no-process-env */
import { SocketConnectionManager } from './socket-connection-manager';
import { type SocketConfiguration } from './types';

const CONNECTION_AMOUNT = Number.parseInt(process.env.CONNECTION_AMOUNT ?? '640', 10);

describe('Board Collaboration - Connection Load Test', () => {
	const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

	it(`should run a connection load test: ${CONNECTION_AMOUNT} connections`, async () => {
		const { COURSE_ID, TOKEN, TARGET_URL } = process.env;
		if (COURSE_ID && TOKEN && TARGET_URL) {
			const socketConfiguration: SocketConfiguration = {
				baseUrl: TARGET_URL,
				path: '/board-collaboration',
				token: TOKEN,
				connectTimeout: 50000,
			};
			const manager = new SocketConnectionManager(socketConfiguration);
			const sockets = await manager.createConnections(CONNECTION_AMOUNT);
			await sleep(3000);
			expect(sockets).toHaveLength(CONNECTION_AMOUNT);
			manager.destroySocketConnections();
		} else {
			expect('this should only be ran manually').toBeTruthy();
		}
	}, 600000);
});
