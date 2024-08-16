/* eslint-disable no-process-env */
import { CreateBoardLoadTest, SocketConfiguration } from './types';
import { viewersClass, collaborativeClass } from './helper/class-definitions';
import { SocketConnectionManager } from './socket-connection-manager';
import { LoadtestRunner } from './loadtest-runner';
import { BoardLoadTest } from './board-load-test';

describe('Board Collaboration Load Test', () => {
	it('should run a basic load test', async () => {
		const { COURSE_ID, TOKEN, TARGET_URL } = process.env;
		const viewerClassesAmount = process.env.viewerClasses ? parseInt(process.env.viewerClasses, 10) : 20;
		const collabClassesAmount = process.env.collabClasses ? parseInt(process.env.collabClasses, 10) : 0;
		if (COURSE_ID && TOKEN && TARGET_URL) {
			const socketConfiguration: SocketConfiguration = {
				baseUrl: TARGET_URL,
				path: '/board-collaboration',
				token: TOKEN,
				connectTimeout: 5000,
			};

			const socketConnectionManager = new SocketConnectionManager(socketConfiguration);
			const createBoardLoadTest: CreateBoardLoadTest = (...args) => new BoardLoadTest(...args);
			const runner = new LoadtestRunner(socketConnectionManager, createBoardLoadTest);
			await runner.runLoadtest({
				socketConfiguration,
				courseId: COURSE_ID,
				configurations: [
					{ classDefinition: viewersClass, amount: viewerClassesAmount },
					{ classDefinition: collaborativeClass, amount: collabClassesAmount },
				],
			});
		} else {
			expect('this should only be ran manually').toBeTruthy();
		}
	}, 600000);
});
