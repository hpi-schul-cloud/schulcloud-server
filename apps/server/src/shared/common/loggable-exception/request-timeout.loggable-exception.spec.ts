import { RequestTimeoutLoggableException } from './request-timeout.loggable-exception';

describe(RequestTimeoutLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const url = 'https://test.com/';

			const exception = new RequestTimeoutLoggableException(url);

			return {
				exception,
				url,
			};
		};

		it('should log the correct message', () => {
			const { exception, url } = setup();

			const result = exception.getLogMessage();

			expect(result).toEqual({
				type: 'REQUEST_TIMEOUT',
				stack: expect.any(String),
				data: {
					url,
				},
			});
		});
	});
});
