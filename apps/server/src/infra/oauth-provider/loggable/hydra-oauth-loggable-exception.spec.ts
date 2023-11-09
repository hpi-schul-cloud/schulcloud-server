import { HydraOauthLoggableException } from './hydra-oauth-loggable-exception';

describe(HydraOauthLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const url = 'url';
			const method = 'method';
			const errorMessage = 'thisIsTheMessage';
			const errorStatusCode = 127;

			const exception = new HydraOauthLoggableException(url, method, errorMessage, errorStatusCode);

			return {
				exception,
				url,
				method,
				errorMessage,
				errorStatusCode,
			};
		};

		it('should return the correct log message', () => {
			const { exception, url, method, errorMessage } = setup();

			const message = exception.getLogMessage();

			expect(message).toEqual({
				type: 'HYDRA_OAUTH_ERROR',
				message: 'Hydra oauth error occurred',
				stack: expect.stringContaining(`HydraOauthLoggableException: ${errorMessage}`) as string,
				data: {
					url,
					method,
				},
			});
		});
	});
});
