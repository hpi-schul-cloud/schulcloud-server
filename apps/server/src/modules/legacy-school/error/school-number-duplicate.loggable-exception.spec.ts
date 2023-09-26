import { SchoolNumberDuplicateLoggableException } from './school-number-duplicate.loggable-exception';

describe('SchoolNumberDuplicateLoggableException', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const officialSchoolNumber = '1234';

			const exception = new SchoolNumberDuplicateLoggableException(officialSchoolNumber);

			return {
				exception,
				officialSchoolNumber,
			};
		};

		it('should log the correct message', () => {
			const { exception, officialSchoolNumber } = setup();

			const result = exception.getLogMessage();

			expect(result).toEqual({
				type: 'SCHOOL_NUMBER_DUPLICATE',
				message: expect.any(String),
				stack: expect.any(String),
				data: {
					officialSchoolNumber,
				},
			});
		});
	});
});
