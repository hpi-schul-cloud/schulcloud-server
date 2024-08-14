/* eslint-disable no-promise-executor-return */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-process-env */
import { SocketConnectionManager } from './SocketConnectionManager';
import { SocketConfiguration } from './types';

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
			const sockets = await manager.createConnections(150);
			await sleep(3000);
			expect(sockets).toHaveLength(150);
			await manager.destroySocketConnections(sockets);
			expect('super').toBeTruthy();
		} else {
			expect('this should only be ran manually').toBeTruthy();
		}
	}, 600000);
});
