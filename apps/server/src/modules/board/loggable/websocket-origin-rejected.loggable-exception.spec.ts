import { WebsocketOriginRejectedLoggableException } from './websocket-origin-rejected.loggable-exception';

describe(WebsocketOriginRejectedLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const requestOrigin = 'https://evil.example.com';
			const expectedOrigin = 'https://school.example.com';

			const exception = new WebsocketOriginRejectedLoggableException(requestOrigin, expectedOrigin);

			return { exception, requestOrigin, expectedOrigin };
		};

		it('should return the correct log message', () => {
			const { exception, requestOrigin, expectedOrigin } = setup();

			const message = exception.getLogMessage();

			expect(message).toEqual({
				type: 'WEBSOCKET_ORIGIN_REJECTED',
				stack: expect.any(String),
				data: { requestOrigin, expectedOrigin },
			});
		});
	});
});
