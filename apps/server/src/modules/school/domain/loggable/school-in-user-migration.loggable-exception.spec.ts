import { schoolFactory } from '../../testing';
import { SchoolInUserMigrationLoggableException } from './school-in-user-migration.loggable-exception';

describe(SchoolInUserMigrationLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const school = schoolFactory.build();

			const exception = new SchoolInUserMigrationLoggableException(school);

			return {
				school,
				exception,
			};
		};

		it('should return log message', () => {
			const { exception, school } = setup();

			const result = exception.getLogMessage();

			expect(result).toStrictEqual({
				message: 'School year change unavailable while in user migration',
				type: 'SCHOOL_IN_USER_MIGRATION',
				stack: exception.stack,
				data: {
					schoolId: school.id,
				},
			});
		});
	});
});
