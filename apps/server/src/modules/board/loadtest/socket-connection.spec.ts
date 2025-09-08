import { SocketConnection } from './socket-connection';
import { Callback } from './types';

const onListeners: Record<string, Callback[]> = {};
const onMock = jest.fn().mockImplementation((action: string, listener: Callback) => {
	onListeners[action] = onListeners[action] || [];
	onListeners[action].push(listener);
});

const onceListeners: Record<string, Callback[]> = {};
const onceMock = (action: string, listener: Callback) => {
	onceListeners[action] = onceListeners[action] || [];
	onceListeners[action].push(listener);
};

const onAnyListeners: Callback[] = [];
const onAnyMock = (listener: Callback) => {
	onAnyListeners.push(listener);
};

let doesConnectWork = true;

const ioMock = {
	emit: jest.fn(),
	on: onMock,
	onAny: onAnyMock,
	once: onceMock,
	connect: jest.fn().mockImplementation(() => {
		if (doesConnectWork && onListeners.connect) {
			onListeners.connect.forEach((listener) => listener(true));
		}
		if (!doesConnectWork && onListeners.connect_error) {
			onListeners.connect.forEach((listener) => listener(false));
		}
	}),
	close: jest.fn(),
};

jest.mock('socket.io-client', () => {
	return {
		io: jest.fn().mockImplementation(() => ioMock),
	};
});

describe('SocketConnection', () => {
	const setup = () => {
		const onError = jest.fn();
		const socketConfiguration = { baseUrl: 'http://localhost:4650', path: '/board-collaboration', token: 'abc' };
		const socketConnection = new SocketConnection(socketConfiguration, onError);

		return { socketConnection, onError };
	};

	describe('connect', () => {
		it('should resolve if the socket connects', async () => {
			const { socketConnection } = setup();
			doesConnectWork = true;
			const result = await socketConnection.connect();

			expect(result).toBe(true);
		});
	});

	describe('emit', () => {
		it('should call socket.emit', async () => {
			const { socketConnection } = setup();
			const action = 'some-action';
			const data = { isOwnAction: true };
			doesConnectWork = true;

			await socketConnection.connect();
			socketConnection.emit(action, data);

			expect(ioMock.emit).toHaveBeenCalledWith(action, data);
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

	describe('registerPromise', () => {
		it("should register a promise and execute it's listener", async () => {
			const { socketConnection } = setup();
			const action = 'some-action-success';
			const data = { isOwnAction: true };
			doesConnectWork = true;

			await socketConnection.connect();
			const mockResolve = jest.fn();
			const mockReject = jest.fn();
			socketConnection.registerPromise(action, mockResolve, mockReject);
			onAnyListeners.forEach((l) => l(action, data));

			expect(mockResolve).toHaveBeenCalledWith(data);
		});
	});

	describe('checkTimeouts', () => {
		it('should reject the promise if the timeout is reached', () => {
			const { socketConnection } = setup();
			const action = 'some-action-success';
			const reject = jest.fn();

			socketConnection.registerPromise(action, jest.fn(), reject, -10);
			socketConnection.checkTimeouts();

			expect(reject).toHaveBeenCalled();
		});
	});

	describe('ensureRunningTimeoutChecks', () => {
		it('should set a timeout', () => {
			const { socketConnection } = setup();
			const setIntervalSpy = jest.spyOn(global, 'setInterval');

			socketConnection.ensureRunningTimeoutChecks();

			expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 1000);
		});
	});

	describe('close', () => {
		it('should disconnect the socket', async () => {
			const { socketConnection } = setup();

			await socketConnection.connect();

			socketConnection.close();
			expect(socketConnection.isConnected()).toBe(false);
		});
	});
});
