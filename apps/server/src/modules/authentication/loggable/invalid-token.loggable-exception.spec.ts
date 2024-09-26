import { InvalidTokenLoggableException } from './invalid-token.loggable-exception';

describe(InvalidTokenLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const exception = new InvalidTokenLoggableException();

			return {
				exception,
			};
		};

		it('should return the correct log message', () => {
			const { exception } = setup();

			const message = exception.getLogMessage();

			expect(message).toEqual({
				type: 'INVALID_TOKEN',
				stack: expect.any(String),
			});
		});
	});
});
