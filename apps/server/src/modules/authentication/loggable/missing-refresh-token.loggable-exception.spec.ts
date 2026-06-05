import { MissingRefreshTokenLoggableException } from './missing-refresh-token.loggable-exception';

describe(MissingRefreshTokenLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const systemId = 'test-system-id';
			const exception = new MissingRefreshTokenLoggableException(systemId);

			return {
				exception,
				systemId,
			};
		};

		it('should return the correct log message', () => {
			const { exception, systemId } = setup();

			const message = exception.getLogMessage();

			expect(message).toEqual({
				type: 'MISSING_REFRESH_TOKEN',
				stack: expect.any(String),
				data: {
					systemId,
				},
			});
		});
	});
});
