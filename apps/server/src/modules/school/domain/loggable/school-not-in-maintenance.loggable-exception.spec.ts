import { schoolFactory } from '../../testing';
import { SchoolNotInMaintenanceLoggableException } from './school-not-in-maintenance.loggable-exception';

describe(SchoolNotInMaintenanceLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const school = schoolFactory.build();

			const exception = new SchoolNotInMaintenanceLoggableException(school);

			return {
				school,
				exception,
			};
		};

		it('should return log message', () => {
			const { exception, school } = setup();

			const result = exception.getLogMessage();

			expect(result).toStrictEqual({
				message: 'School has to be in maintenance',
				type: 'SCHOOL_NOT_IN_MAINTENANCE',
				stack: exception.stack,
				data: {
					schoolId: school.id,
				},
			});
		});
	});
});
