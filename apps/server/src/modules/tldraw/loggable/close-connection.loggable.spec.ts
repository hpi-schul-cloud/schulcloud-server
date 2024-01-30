import { CloseConnectionLoggable } from './close-connection.loggable';

describe('CloseConnectionLoggable', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const error = new Error('test');
			const loggable = new CloseConnectionLoggable(error);

			return { loggable, error };
		};

		it('should return a loggable message', () => {
			const { loggable, error } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				message: 'Close web socket connection error',
				type: 'CLOSE_WEB_SOCKET_CONNECTION_ERROR',
				error,
			});
		});
	});
});
