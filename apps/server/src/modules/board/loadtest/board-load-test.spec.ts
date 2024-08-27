import { BoardLoadTest } from './board-load-test';
import { fastEditor } from './helper/class-definitions';
import { SocketConnectionManager } from './socket-connection-manager';
import { ClassDefinition } from './types';
import { SocketConnection } from './socket-connection';
import { LoadtestClient } from './loadtest-client';

jest.mock('./helper/sleep', () => {
	return { sleep: () => Promise.resolve(true) };
});

jest.mock('./loadtest-client', () => {
	return {
		createColumn: jest.fn().mockResolvedValue({ id: 'some-id' }),
		createCard: jest.fn().mockResolvedValue({ id: 'some-id' }),
		createElement: jest.fn().mockResolvedValue({ id: 'some-id' }),
		createAndUpdateLinkElement: jest.fn().mockResolvedValue({ id: 'some-id' }),
		createAndUpdateTextElement: jest.fn().mockResolvedValue({ id: 'some-id' }),
		updateCardTitle: jest.fn().mockResolvedValue({ id: 'some-id' }),
		updateColumnTitle: jest.fn().mockResolvedValue({ id: 'some-id' }),
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
		return { boarLoadTest, socketConnectionManager, socketConnection };
	};

	describe('runBoardTest', () => {
		describe('if no userProfiles are provided', () => {
			it('should do nothing', async () => {
				const { boarLoadTest } = setup();
				const boardId = 'board-id';
				const configuration = { name: 'my-configuration', users: [], simulateUsersTimeMs: 2000 };

				const response = await boarLoadTest.runBoardTest(boardId, configuration);

				expect(response).toBeUndefined();
			});
		});

		describe('if userProfiles are provided', () => {
			it('should create socketConnections for all users', async () => {
				const { boarLoadTest, socketConnectionManager } = setup();
				const boardId = 'board-id';

				await boarLoadTest.runBoardTest(boardId, testClass);

				expect(socketConnectionManager.createConnections).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe('simulateUserActions', () => {
		it('should create columns and cards', async () => {
			const { boarLoadTest } = setup();
			const loadtestClient = {
				createColumn: jest.fn().mockResolvedValue({ id: 'some-id' }),
				createCard: jest.fn().mockResolvedValue({ id: 'some-id' }),
				createElement: jest.fn().mockResolvedValue({ id: 'some-id' }),
				createAndUpdateLinkElement: jest.fn().mockResolvedValue({ id: 'some-id' }),
				createAndUpdateTextElement: jest.fn().mockResolvedValue({ id: 'some-id' }),
				fetchBoard: jest.fn().mockResolvedValue({ id: 'some-id' }),
				updateCardTitle: jest.fn().mockResolvedValue({ id: 'some-id' }),
				updateColumnTitle: jest.fn().mockResolvedValue({ id: 'some-id' }),
			} as unknown as LoadtestClient;
			const userProfile = fastEditor;

			await boarLoadTest.simulateUserActions(loadtestClient, userProfile, 50);

			expect(loadtestClient.createColumn).toHaveBeenCalled();
			expect(loadtestClient.createCard).toHaveBeenCalled();
		}, 10000);
	});

	describe('createColumn', () => {
		it('should create a column', async () => {
			const { boarLoadTest } = setup();

			const loadtestClient = {
				createColumn: jest.fn().mockResolvedValue({ id: 'some-id' }),
				updateColumnTitle: jest.fn().mockResolvedValue({ id: 'some-id' }),
			} as unknown as LoadtestClient;
			await boarLoadTest.createColumn(loadtestClient);

			expect(loadtestClient.createColumn).toHaveBeenCalled();
		});
	});

	describe('createRandomCard', () => {
		it('should create a card', async () => {
			const { boarLoadTest } = setup();
			boarLoadTest.trackColumn('some-id');

			const loadtestClient = {
				createCard: jest.fn().mockResolvedValue({ id: 'some-id' }),
				updateCardTitle: jest.fn().mockResolvedValue({ id: 'some-id' }),
				createAndUpdateLinkElement: jest.fn().mockResolvedValue({ id: 'some-id' }),
				createAndUpdateTextElement: jest.fn().mockResolvedValue({ id: 'some-id' }),
			} as unknown as LoadtestClient;
			await boarLoadTest.createRandomCard(loadtestClient);

			expect(loadtestClient.createCard).toHaveBeenCalled();
		}, 100000);
	});
});
