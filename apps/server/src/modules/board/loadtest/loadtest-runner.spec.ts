import { viewersClass } from './helper/class-definitions';
import { LoadtestRunner } from './loadtest-runner';
import { SocketConnectionManager } from './socket-connection-manager';
import { Configuration } from './types';

jest.mock('./socket-connection-manager');

jest.mock('./helper/create-board', () => {
	return {
		createBoard: jest.fn().mockResolvedValue({ id: 'board123' }),
	};
});

describe('LoadtestRunner', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	const setup = () => {
		const runBoardTest = jest.fn().mockResolvedValue({ responseTimes: [] });
		const createBoardLoadTest = jest.fn().mockImplementation(() => {
			return { runBoardTest };
		});
		const socketConfiguration = { baseUrl: 'http://localhost', path: '', token: '' };
		const socketConnectionManager = new SocketConnectionManager(socketConfiguration);
		const loadtestRunner = new LoadtestRunner(socketConnectionManager, createBoardLoadTest);

		return { loadtestRunner, socketConfiguration, runBoardTest };
	};

	describe('getErrorCount', () => {
		it('should get the error count correctly', () => {
			const { loadtestRunner } = setup();
			loadtestRunner.onError('Error 1');
			loadtestRunner.onError('Error 2');
			loadtestRunner.onError('Error 3');

			const errorCount = loadtestRunner.getErrorCount();

			expect(errorCount).toBe(3);
		});
	});

	describe('runLoadtest', () => {
		it('should run the loadtest', async () => {
			const { loadtestRunner, socketConfiguration, runBoardTest } = setup();
			const courseId = '123';
			const configurations: Configuration[] = [{ classDefinition: viewersClass, amount: 1 }];

			await loadtestRunner.runLoadtest({ socketConfiguration, courseId, configurations });

			expect(runBoardTest).toHaveBeenCalled();
		});
	});
});
