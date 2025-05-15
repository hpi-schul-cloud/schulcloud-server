import { schoolFactory } from '../../testing';
import { SchoolAlreadyInNextYearLoggableException } from './school-already-in-next-year.loggable-exception';

describe(SchoolAlreadyInNextYearLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const school = schoolFactory.build();

			const exception = new SchoolAlreadyInNextYearLoggableException(school);

			return {
				school,
				exception,
			};
		};

		it('should return log message', () => {
			const { exception, school } = setup();

			const result = exception.getLogMessage();

			expect(result).toStrictEqual({
				message: 'School already in next year',
				type: 'SCHOOL_ALREADY_IN_NEXT_YEAR',
				stack: exception.stack,
				data: {
					schoolId: school.id,
					schoolYear: school.currentYear?.name,
				},
			});
		});
	});
});
