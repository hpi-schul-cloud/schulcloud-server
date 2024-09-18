import { io, Socket } from 'socket.io-client';
import { v4 as uuid } from 'uuid';
import { Callback, SocketConfiguration } from './types';
import { useResponseTimes } from './helper/responseTimes.composable';

type RegisteredPromise = { event: string; resolve: Callback; reject: Callback; handle: string; startTime: number };

const { addResponseTime } = useResponseTimes();

export class SocketConnection {
	private socket: Socket;

	private socketConfiguration: SocketConfiguration;

	private connected = false;

	private registeredPromises: Record<string, RegisteredPromise[]> = {};

	private timeoutuntilList: { timeoutUntil: number; handle: string }[] = [];

	private checkerInterval: NodeJS.Timeout | undefined;

	private onError: Callback;

	constructor(socketConfiguration: SocketConfiguration, onError: Callback | undefined) {
		this.socketConfiguration = socketConfiguration;
		this.onError = onError ?? console.log;
		const options = socketConfiguration.options || {
			path: socketConfiguration.path,
			withCredentials: true,
			autoConnect: true,
			forceNew: true,
		};

		const { token, baseUrl } = socketConfiguration;
		if (token) {
			options.extraHeaders = { cookie: ` USER_TIMEZONE=Europe/Berlin; jwt=${token}` };
		}

		this.socket = io(baseUrl, options);
	}

	async connect() {
		this.ensureRunningTimeoutChecks();
		return new Promise((resolve, reject) => {
			let handle: NodeJS.Timeout | undefined;
			if (this.socket.connected) {
				/* istanbul ignore next */
				resolve(true);
			}

			this.socket.on('connect', () => {
				this.connected = true;
				if (handle) clearTimeout(handle);
				resolve(true);
			});

			this.socket.on('disconnect', () => {
				/* istanbul ignore next */
				this.connected = false;
			});

			this.socket.once('connect_error', (err) => {
				if (handle) clearTimeout(handle);
				this.onError(`Could not connect to socket server: ${err.message}`);
				reject(new Error(`Could not connect to socket server: ${err.message}`));
			});

			this.socket.onAny((event: string, data: { isOwnAction: boolean }) => {
				if (data.isOwnAction === true) {
					this.processRegisteredPromises(event, data);
				}
			});

			this.socket.connect();

			handle = setTimeout(() => {
				/* istanbul ignore next */
				if (!this.connected) {
					this.stopTimeoutChecks();
					reject(new Error('Timeout: could not connect to socket server'));
				}
			}, this.socketConfiguration.connectTimeout ?? 10000);
			this.stopTimeoutChecks();
		});
	}

	emit = (event: string, data: unknown) => {
		this.socket.emit(event, data);
	};

	// eslint-disable-next-line arrow-body-style
	emitAndWait = async (actionPrefix: string, payload: unknown, timeoutMs = 10000) => {
		/* istanbul ignore next */
		return new Promise((resolve, reject) => {
			this.socket.emit(`${actionPrefix}-request`, payload);
			this.registerPromise(`${actionPrefix}-success`, resolve, reject, timeoutMs);
		});
	};

	ensureRunningTimeoutChecks() {
		if (!this.checkerInterval) {
			this.checkerInterval = setInterval(() => this.checkTimeouts(), 1000);
		}
	}

	stopTimeoutChecks() {
		if (!this.checkerInterval) {
			/* istanbul ignore next */
			clearInterval(this.checkerInterval);
		}
	}

	checkTimeouts() {
		const now = performance.now();
		while (this.timeoutuntilList.length > 0 && this.timeoutuntilList[0]?.timeoutUntil < now) {
			const first = this.timeoutuntilList.shift();
			if (first) {
				const { handle } = first;
				const promise = this.getRegisteredPromise(handle);
				if (promise) {
					this.unregisterPromise(handle, handle);
					this.unregisterTimeout(handle);
					const message = `Timeout exceeded: ${promise.event}`;
					this.onError(message);
					promise.reject(new Error(message));
				}
			}
		}
	}

	processRegisteredPromises(event: string, data: unknown) {
		const promises = this.registeredPromises[event];
		if (promises) {
			for (const promise of promises) {
				const responseTime = performance.now() - promises[0].startTime;
				this.unregisterPromise(event, promise.handle);
				this.unregisterTimeout(promise.handle);
				addResponseTime({ action: event, responseTime });
				promise.resolve(data);
			}
		}
	}

	registerPromise(successEvent: string, resolve: Callback, reject: Callback, timeoutMs = 10000) {
		const startTime = performance.now();
		const handle = uuid();
		const failureEvent = successEvent.replace('-success', '-failure');
		this.registeredPromises[successEvent] = this.registeredPromises[successEvent] ?? [];
		this.registeredPromises[successEvent].push({ resolve, reject, handle, startTime, event: successEvent });
		this.registeredPromises[failureEvent] = this.registeredPromises[failureEvent] ?? [];
		this.registeredPromises[failureEvent].push({ resolve: reject, reject, handle, startTime, event: failureEvent });
		this.registerTimeout(handle, startTime + timeoutMs);
		return handle;
	}

	getRegisteredPromise(handle: string) {
		const promises = Object.values(this.registeredPromises).flat();
		return promises.find((p) => p.handle === handle);
	}

	unregisterPromise(successEvent: string, handle: string) {
		const failureEvent = successEvent.replace('-success', '-failure');
		this.registeredPromises[successEvent] = this.registeredPromises[successEvent]?.filter((p) => p.handle !== handle);
		this.registeredPromises[failureEvent] = this.registeredPromises[failureEvent]?.filter((p) => p.handle !== handle);
	}

	registerTimeout(handle: string, timeoutUntil: number) {
		this.timeoutuntilList.push({ handle, timeoutUntil });
	}

	unregisterTimeout(handle: string) {
		this.timeoutuntilList = this.timeoutuntilList.filter((t) => t.handle !== handle);
	}

	isConnected() {
		return this.connected;
	}

	close() {
		this.socket.close();
		this.connected = false;
	}
}
