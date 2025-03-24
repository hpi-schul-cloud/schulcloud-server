import { ExternalSchoolNumberMissingLoggableException } from './external-school-number-missing.loggable-exception';

describe(ExternalSchoolNumberMissingLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const externalSchoolId = 'externalSchoolId';
			const exception = new ExternalSchoolNumberMissingLoggableException(externalSchoolId);

			return {
				exception,
				externalSchoolId,
			};
		};

		it('should return the correct log message', () => {
			const { exception, externalSchoolId } = setup();

			const message = exception.getLogMessage();

			expect(message).toEqual({
				type: 'EXTERNAL_SCHOOL_NUMBER_MISSING',
				message: 'The external system did not provide a official school number for the school.',
				stack: expect.any(String),
				data: {
					externalSchoolId,
				},
			});
		});
	});
});
