import { WebsocketCloseErrorLoggable } from './websocket-close-error.loggable';

describe('WebsocketCloseErrorLoggable', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const error = new Error('test');
			const loggable = new WebsocketCloseErrorLoggable(error);

			return { loggable, error };
		};

		it('should return a loggable message', () => {
			const { loggable, error } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				message: 'Error while closing the websocket connection - it may already be closed',
				type: 'WEBSOCKET_CLOSE_ERROR',
				error,
			});
		});
	});
});
