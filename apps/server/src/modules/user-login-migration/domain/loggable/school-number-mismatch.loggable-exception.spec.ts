import { SchoolNumberMismatchLoggableException } from './school-number-mismatch.loggable-exception';

describe(SchoolNumberMismatchLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const sourceSchoolNumber = '123';
			const targetSchoolNumber = '456';

			const exception = new SchoolNumberMismatchLoggableException(sourceSchoolNumber, targetSchoolNumber);

			return {
				exception,
				sourceSchoolNumber,
				targetSchoolNumber,
			};
		};

		it('should return the correct log message', () => {
			const { exception, sourceSchoolNumber, targetSchoolNumber } = setup();

			const message = exception.getLogMessage();

			expect(message).toEqual({
				type: 'SCHOOL_MIGRATION_FAILED',
				message: 'School could not migrate during user migration process.',
				stack: expect.any(String),
				data: {
					sourceSchoolNumber,
					targetSchoolNumber,
				},
			});
		});
	});
});
