import { io, type Socket } from 'socket.io-client';
import { v4 as uuid } from 'uuid';
import { useResponseTimes } from './helper/responseTimes.composable';
import { type Callback, type SocketConfiguration } from './types';

type RegisteredPromise = { event: string; resolve: Callback; reject: Callback; handle: string; startTime: number };

const { addResponseTime } = useResponseTimes();

export class SocketConnection {
	private readonly socket: Socket;

	private readonly socketConfiguration: SocketConfiguration;

	private readonly onError: Callback;

	private connected = false;

	private registeredPromises: Record<string, RegisteredPromise[]> = {};

	private timeoutuntilList: { timeoutUntil: number; handle: string }[] = [];

	private checkerInterval: NodeJS.Timeout | undefined;

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

	public connect(): Promise<boolean> {
		this.ensureRunningTimeoutChecks();
		return new Promise((resolve, reject) => {
			let handle: NodeJS.Timeout | undefined = undefined;
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

	public emit = (event: string, data: unknown): void => {
		this.socket.emit(event, data);
	};

	// eslint-disable-next-line arrow-body-style
	public emitAndWait = (actionPrefix: string, payload: unknown, timeoutMs = 10000): Promise<unknown> => {
		/* istanbul ignore next */
		return new Promise((resolve, reject) => {
			this.socket.emit(`${actionPrefix}-request`, payload);
			this.registerPromise(`${actionPrefix}-success`, resolve, reject, timeoutMs);
		});
	};

	public ensureRunningTimeoutChecks(): void {
		this.checkerInterval ??= setInterval(() => this.checkTimeouts(), 1000);
	}

	public stopTimeoutChecks(): void {
		if (this.checkerInterval) {
			clearInterval(this.checkerInterval);
			this.checkerInterval = undefined;
		}
	}

	public checkTimeouts(): void {
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

	public processRegisteredPromises(event: string, data: unknown): void {
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

	public registerPromise(successEvent: string, resolve: Callback, reject: Callback, timeoutMs = 10000): string {
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

	public getRegisteredPromise(handle: string): RegisteredPromise | undefined {
		const promises = Object.values(this.registeredPromises).flat();
		return promises.find((p) => p.handle === handle);
	}

	public unregisterPromise(successEvent: string, handle: string): void {
		const failureEvent = successEvent.replace('-success', '-failure');
		this.registeredPromises[successEvent] = this.registeredPromises[successEvent]?.filter((p) => p.handle !== handle);
		this.registeredPromises[failureEvent] = this.registeredPromises[failureEvent]?.filter((p) => p.handle !== handle);
	}

	public registerTimeout(handle: string, timeoutUntil: number): void {
		this.timeoutuntilList.push({ handle, timeoutUntil });
	}

	public unregisterTimeout(handle: string): void {
		this.timeoutuntilList = this.timeoutuntilList.filter((t) => t.handle !== handle);
	}

	public isConnected(): boolean {
		return this.connected;
	}

	public close(): void {
		this.stopTimeoutChecks();
		this.socket.close();
		this.connected = false;
	}
}
