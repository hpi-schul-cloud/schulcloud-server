import { io, Socket } from 'socket.io-client';
import { SocketConfiguration } from './types';

export class SocketConnection {
	private socket: Socket;

	private socketConfiguration: SocketConfiguration;

	private connected = false;

	constructor(socketConfiguration: SocketConfiguration) {
		this.socketConfiguration = socketConfiguration;
		const options = socketConfiguration.options || {
			path: socketConfiguration.path,
			withCredentials: true,
			autoConnect: true,
			// forceNew: true,
		};

		const { token, baseUrl } = socketConfiguration;
		if (token) {
			options.extraHeaders = { cookie: ` USER_TIMEZONE=Europe/Berlin; jwt=${token}` };
		}

		this.socket = io(baseUrl, options);
	}

	async connect() {
		return new Promise((resolve, reject) => {
			let handle: NodeJS.Timeout | undefined;
			if (this.socket.connected) {
				resolve(true);
			}

			this.socket.on('connect', () => {
				this.connected = true;
				if (handle) clearTimeout(handle);
				resolve(true);
			});

			this.socket.on('disconnect', () => {
				this.connected = false;
			});

			this.socket.once('connect_error', (err) => {
				if (handle) clearTimeout(handle);
				reject(new Error(`Could not connect to socket server: ${err.message}`));
			});

			this.socket.connect();

			handle = setTimeout(() => {
				if (!this.connected) {
					reject(new Error('Timeout: could not connect to socket server'));
				}
			}, this.socketConfiguration.connectTimeout ?? 5000);
		});
	}

	emit = (event: string, data: unknown) => {
		this.socket.emit(event, data);
	};

	on = (event: string, callback: (...args: any[]) => void) => {
		this.socket.on(event, callback);
	};

	onAny = (callback: (...args: any[]) => void) => {
		this.socket.onAny(callback);
	};

	off = (event: string, callback: (...args: any[]) => void) => {
		this.socket.off(event, callback);
	};

	disconnect() {
		this.socket.disconnect();
	}

	close() {
		this.socket.close();
	}
}
