import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { WsCloseCode, WsCloseMessage } from '../types';

export class WebsocketInitErrorLoggable implements Loggable {
	private readonly error: Error | undefined;

	constructor(
		private readonly code: WsCloseCode,
		private readonly message: WsCloseMessage,
		private readonly docName: string,
		private readonly err?: unknown
	) {
		if (err instanceof Error) {
			this.error = err;
		}
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: `[${this.docName}] [${this.code}] ${this.message}`,
			type: 'WEBSOCKET_CONNECTION_INIT_ERROR',
			error: this.error,
		};
	}
}
