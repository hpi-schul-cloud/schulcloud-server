/* eslint-disable no-promise-executor-return */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-process-env */
import { SocketConnectionManager } from './socket-connection-manager';
import { SocketConfiguration } from './types';

const CONNECTION_AMOUNT = parseInt(process.env.CONNECTION_AMOUNT ?? '640', 10);

describe('Board Collaboration - Connection Load Test', () => {
	async function sleep(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	it('should run a connection load test', async () => {
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
			await manager.destroySocketConnections(sockets);
		} else {
			expect('this should only be ran manually').toBeTruthy();
		}
	}, 600000);
});
