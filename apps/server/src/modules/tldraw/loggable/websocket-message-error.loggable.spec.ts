import { WebsocketMessageErrorLoggable } from './websocket-message-error.loggable';

describe('WebsocketMessageErrorLoggable', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const error = new Error('test');
			const loggable = new WebsocketMessageErrorLoggable(error);

			return { loggable, error };
		};

		it('should return a loggable message', () => {
			const { loggable, error } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				message: 'Error while handling websocket message',
				type: 'WEBSOCKET_MESSAGE_ERROR',
				error,
			});
		});
	});
});
