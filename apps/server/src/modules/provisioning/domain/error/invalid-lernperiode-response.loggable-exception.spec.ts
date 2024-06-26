import { InvalidLernperiodeResponseLoggableException } from './invalid-lernperiode-response.loggable-exception';

describe(InvalidLernperiodeResponseLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const lernperiode = '2024-223';

			const exception = new InvalidLernperiodeResponseLoggableException(lernperiode);

			return {
				exception,
				lernperiode,
			};
		};

		it('should return the correct log message', () => {
			const { exception, lernperiode } = setup();

			const message = exception.getLogMessage();

			expect(message).toEqual({
				type: 'INVALID_LERNPERIODE_RESPONSE',
				stack: expect.any(String),
				data: {
					lernperiode,
				},
			});
		});
	});
});
