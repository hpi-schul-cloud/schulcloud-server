import { SchulconnexLaufzeitResponse } from '@infra/schulconnex-client';
import { InvalidLaufzeitResponseLoggableException } from './invalid-laufzeit-response.loggable-exception';

describe(InvalidLaufzeitResponseLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const laufzeit = new SchulconnexLaufzeitResponse();

			const exception = new InvalidLaufzeitResponseLoggableException(laufzeit);

			return {
				exception,
				laufzeit,
			};
		};

		it('should return the correct log message', () => {
			const { exception, laufzeit } = setup();

			const message = exception.getLogMessage();

			expect(message).toEqual({
				type: 'INVALID_LAUFZEIT_RESPONSE',
				stack: expect.any(String),
				data: {
					laufzeit,
				},
			});
		});
	});
});
