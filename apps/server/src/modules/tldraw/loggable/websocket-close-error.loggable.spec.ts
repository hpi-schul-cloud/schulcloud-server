import { WebsocketCloseErrorLoggable } from './websocket-close-error.loggable';

describe('WebsocketCloseErrorLoggable', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const error = new Error('test');
			const errorMessage = 'message';

			const loggable = new WebsocketCloseErrorLoggable(error, errorMessage);
			return { loggable, error, errorMessage };
		};

		it('should return a loggable message', () => {
			const { loggable, error, errorMessage } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({ message: errorMessage, error, type: 'WEBSOCKET_CLOSE_ERROR' });
		});
	});
});
