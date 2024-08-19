import { SocketConnection } from './socket-connection';
import { Callback } from './types';

const onListeners: Record<string, Callback[]> = {};
const onMock = (action: string, listener: Callback) => {
	onListeners[action] = onListeners[action] || [];
	onListeners[action].push(listener);
};
const onceListeners: Record<string, Callback[]> = {};
const onceMock = (action: string, listener: Callback) => {
	onceListeners[action] = onceListeners[action] || [];
	onceListeners[action].push(listener);
};

let doesConnectWork = true;

const ioMock = {
	on: onMock,
	onAny: jest.fn(),
	once: onceMock,
	connect: jest.fn().mockImplementation(() => {
		if (doesConnectWork && onListeners.connect) {
			onListeners.connect.forEach((listener) => listener(true));
		}
		if (!doesConnectWork && onListeners.connect_error) {
			onListeners.connect.forEach((listener) => listener(false));
		}
	}),
};

jest.mock('socket.io-client', () => {
	return {
		io: jest.fn().mockImplementation(() => ioMock),
	};
});

describe('SocketConnection', () => {
	const setup = () => {
		const socketConfiguration = { baseUrl: 'http://localhost:6450', path: '/board-collaboration', token: 'abc' };
		const socketConnection = new SocketConnection(socketConfiguration, console.log);

		return { socketConnection };
	};

	describe('connect', () => {
		it('should resolve if the socket connects', async () => {
			const { socketConnection } = setup();
			doesConnectWork = true;
			const result = await socketConnection.connect();

			expect(result).toBe(true);
		});
	});

	describe('if connection error occurs', () => {
		it('should reject', async () => {
			const { socketConnection } = setup();
			doesConnectWork = false;

			const err = new Error('connection failed');
			const triggerError = () => onceListeners.connect_error.forEach((listener) => listener(err));
			setTimeout(triggerError, 10);

			await expect(socketConnection.connect()).rejects.toThrow('Could not connect to socket server: connection failed');
		});
	});
});
