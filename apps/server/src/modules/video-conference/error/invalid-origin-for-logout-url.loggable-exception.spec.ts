import { InvalidOriginForLogoutUrlLoggableException } from './invalid-origin-for-logout-url.loggable-exception';

describe('InvalidOriginForLogoutUrlLoggableException', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const exception = new InvalidOriginForLogoutUrlLoggableException('https://logout-url.com', 'https://origin.com');

			return {
				exception,
			};
		};

		it('should log the correct message', () => {
			const { exception } = setup();

			const result = exception.getLogMessage();

			expect(result).toEqual({
				type: 'INVALID_ORIGIN_FOR_LOGOUT_URL',
				message: expect.any(String),
				stack: expect.any(String),
				data: {
					received: 'https://logout-url.com',
					expected: 'https://origin.com',
				},
			});
		});
	});
});
