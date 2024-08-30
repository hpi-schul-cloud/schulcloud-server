import { SocketConnectionManager } from './socket-connection-manager';

jest.mock('./socket-connection');

describe('SocketConnectionManager', () => {
	const setup = () => {
		const socketConfiguration = { baseUrl: '', path: '', token: '' };
		const socketConnectionManager = new SocketConnectionManager(socketConfiguration);
		return { socketConnectionManager };
	};

	describe('createConnections', () => {
		it('should create the correct amount of connections', async () => {
			const { socketConnectionManager } = setup();

			await socketConnectionManager.createConnections(5);

			expect(socketConnectionManager.getClientCount()).toBe(5);
		});
	});

	describe('destroySocketConnections', () => {
		it('should destroy the connections', async () => {
			const { socketConnectionManager } = setup();
			await socketConnectionManager.createConnections(5);

			expect(socketConnectionManager.getClientCount()).toBe(5);

			await socketConnectionManager.destroySocketConnections();

			expect(socketConnectionManager.getClientCount()).toBe(0);
		});
	});
});
