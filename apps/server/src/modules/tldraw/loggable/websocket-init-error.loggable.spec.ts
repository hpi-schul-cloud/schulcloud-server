import { WebsocketInitErrorLoggable } from './websocket-init-error.loggable';
import { WsCloseCode, WsCloseMessage } from '../types';

describe('WebsocketInitErrorLoggable', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const error = new Error('test');
			const errorCode = WsCloseCode.BAD_REQUEST;
			const errorMessage = WsCloseMessage.BAD_REQUEST;
			const docName = 'test';

			const loggable = new WebsocketInitErrorLoggable(errorCode, errorMessage, docName, error);
			return { loggable, error, errorCode, errorMessage, docName };
		};

		it('should return a loggable message', () => {
			const { loggable, error, errorMessage, errorCode, docName } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				message: `[${docName}] [${errorCode}] ${errorMessage}`,
				type: 'WEBSOCKET_CONNECTION_INIT_ERROR',
				error,
			});
		});
	});
});
