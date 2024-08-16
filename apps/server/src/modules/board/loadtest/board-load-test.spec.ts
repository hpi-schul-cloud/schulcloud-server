import { BoardLoadTest } from './board-load-test';
import { fastEditor } from './helper/class-definitions';
import { SocketConnectionManager } from './socket-connection-manager';
import { ClassDefinition } from './types';
import { SocketConnection } from './socket-connection';

jest.mock('./loadtest-client', () => {
	return {
		createColumn: jest.fn().mockResolvedValue({ id: 'some-id' }),
		createCard: jest.fn().mockResolvedValue({ id: 'some-id' }),
		createElement: jest.fn().mockResolvedValue({ id: 'some-id' }),
	};
});

jest.mock('./socket-connection-manager');

const testClass: ClassDefinition = {
	name: 'viewersClass',
	users: [{ ...fastEditor, amount: 5 }],
};

beforeEach(() => {
	jest.resetAllMocks();
	jest.useFakeTimers();
});

afterEach(() => {
	jest.runOnlyPendingTimers();
	jest.useRealTimers();
});

describe('BoardLoadTest', () => {
	const setup = () => {
		const socketConfiguration = { baseUrl: '', path: '', token: '' };
		const socketConnectionManager = new SocketConnectionManager(socketConfiguration);
		const socketConnection = new SocketConnection(socketConfiguration, console.log);

		const boarLoadTest = new BoardLoadTest(socketConnectionManager, console.log);
		return { boarLoadTest, socketConnectionManager, socketConnection, loadtestClient };
	};

	describe('runBoardTest', () => {
		describe('if no userProfiles are provided', () => {
			it('should do nothing', async () => {
				const { boarLoadTest } = setup();
				const boardId = 'board-id';
				const configuration = { name: 'my-configuration', users: [] };

				const response = await boarLoadTest.runBoardTest(boardId, configuration);

				expect(response).toEqual([]);
			});
		});

		describe('if userProfiles are provided', () => {
			it('should create socketConnections for all users', async () => {
				const { boarLoadTest, socketConnectionManager } = setup();
				const boardId = 'board-id';

				await boarLoadTest.runBoardTest(boardId, testClass);

				expect(socketConnectionManager.createConnection).toHaveBeenCalledTimes(5);
			});
		});
	});
});
