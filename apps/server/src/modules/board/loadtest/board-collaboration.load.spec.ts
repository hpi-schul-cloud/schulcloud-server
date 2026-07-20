/* eslint-disable no-process-env */
import { BoardLoadTest } from './board-load-test';
import { type CreateBoardLoadTest } from './create-board-loadtest';
import { collaborativeClass, viewersClass } from './helper/class-definitions';
import { LoadtestRunner } from './loadtest-runner';
import { SocketConnectionManager } from './socket-connection-manager';
import { type SocketConfiguration } from './types';

describe('Board Collaboration Load Test', () => {
	const shouldRunLoadtest = !!(process.env.COURSE_ID && process.env.TOKEN && process.env.TARGET_URL);

	it('should run a basic load test', async () => {
		if (!shouldRunLoadtest) {
			expect(shouldRunLoadtest).toBe(false);
			return;
		}

		const COURSE_ID = process.env.COURSE_ID ?? '';
		const TOKEN = process.env.TOKEN ?? '';
		const TARGET_URL = process.env.TARGET_URL ?? '';
		const viewerClassesAmount = process.env.VIEWER_CLASSES ? parseInt(process.env.VIEWER_CLASSES, 10) : 20;
		const collabClassesAmount = process.env.COLLAB_CLASSES ? parseInt(process.env.COLLAB_CLASSES, 10) : 0;
		let connectionIssues = 0;

		const socketConfiguration: SocketConfiguration = {
			baseUrl: TARGET_URL,
			path: '/board-collaboration',
			token: TOKEN,
			connectTimeout: 5000,
		};

		const socketConnectionManager = new SocketConnectionManager(socketConfiguration);

		socketConnectionManager.setOnErrorHandler(() => connectionIssues++);
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

		socketConnectionManager.destroySocketConnections();
		expect(connectionIssues).toBe(0);
	}, 600000);
});
