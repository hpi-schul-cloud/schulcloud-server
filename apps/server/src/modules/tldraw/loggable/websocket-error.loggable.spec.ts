import { WebsocketErrorLoggable } from './websocket-error.loggable';

describe('WebsocketErrorLoggable', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const error = new Error('test');

			const loggable = new WebsocketErrorLoggable(error);
			return { loggable, error };
		};

		it('should return a loggable message', () => {
			const { loggable, error } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({ message: 'Websocket error event', error, type: 'WEBSOCKET_ERROR' });
		});
	});
});
