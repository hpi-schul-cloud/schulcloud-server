import { schoolFactory } from '../../testing';
import { SchoolAlreadyInMaintenanceLoggableException } from './school-already-in-maintenance.loggable-exception';

describe(SchoolAlreadyInMaintenanceLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const school = schoolFactory.build();

			const exception = new SchoolAlreadyInMaintenanceLoggableException(school);

			return {
				school,
				exception,
			};
		};

		it('should return log message', () => {
			const { exception, school } = setup();

			const result = exception.getLogMessage();

			expect(result).toStrictEqual({
				message: 'School is already in maintenance',
				type: 'SCHOOL_ALREADY_IN_MAINTENANCE',
				stack: exception.stack,
				data: {
					schoolId: school.id,
				},
			});
		});
	});
});
